import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { logError } from "@/lib/errorLogger";

// Message validation schema
const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, { message: "메시지를 입력해주세요" })
    .max(5000, { message: "메시지는 5000자 이하여야 합니다" })
});

interface Message {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
}

interface ChatRoomInfo {
  id: string;
  academy: {
    id: string;
    name: string;
    profile_image: string | null;
    owner_id: string | null;
  };
  parent_id: string;
  staff_id: string | null;
  parent_profile?: {
    user_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  staff_profile?: {
    display_name: string;
    grade_label: string;
    image_url: string | null;
  } | null;
  current_member_role?: string | null;
}

export const useChatMessages = (chatRoomId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomInfo, setRoomInfo] = useState<ChatRoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [canSend, setCanSend] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!chatRoomId) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setLoading(false);
          return;
        }

        setUserId(session.user.id);

        // Check if user is admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const userRole = roleData?.role ?? null;
        setIsAdmin(userRole === 'admin');
        setIsParent(userRole === 'parent');

        // Fetch room info
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select(`
            id,
            parent_id,
            staff_id,
            academies (
              id,
              name,
              profile_image,
              owner_id
            )
          `)
          .eq('id', chatRoomId)
          .maybeSingle();

        if (roomError || !roomData) {
          logError('ChatMessages Room Fetch', roomError);
          setLoading(false);
          return;
        }

        const academy = roomData.academies as unknown as { id: string; name: string; profile_image: string | null; owner_id: string | null };
        
        // Fetch parent profile if user is admin
        let parentProfile = null;
        let currentMemberRole: string | null = null;
        if (roleData?.role === 'admin') {
          const [{ data: profileData }, { data: memberData }] = await Promise.all([
            supabase
              .from('profiles')
              .select('user_name, phone, email')
              .eq('id', roomData.parent_id)
              .maybeSingle(),
            supabase
              .from('academy_members')
              .select('role')
              .eq('academy_id', academy.id)
              .eq('user_id', session.user.id)
              .maybeSingle()
          ]);
          parentProfile = profileData;
          currentMemberRole = memberData?.role ?? null;
        }

        // Fetch staff profile (상대방 프로필) for 학부모 측에서 보여주기
        let staffProfile: ChatRoomInfo["staff_profile"] = null;
        if (roomData.staff_id) {
          try {
            const { data: staffList } = await supabase.rpc('get_academy_chat_staff', {
              p_academy_id: academy.id,
            });
            const matched = (staffList as any[] | null)?.find(
              (s) => s.user_id === roomData.staff_id
            );
            if (matched) {
              staffProfile = {
                display_name: matched.display_name || '이름 없음',
                grade_label: matched.grade_label || '',
                image_url: matched.image_url || null,
              };
            }
          } catch (error) {
            logError('ChatMessages Staff Fetch', error);
          }
        }

        const computedRoomInfo: ChatRoomInfo = {
          id: roomData.id,
          parent_id: roomData.parent_id,
          staff_id: roomData.staff_id ?? null,
          academy: {
            id: academy.id,
            name: academy.name,
            profile_image: academy.profile_image,
            owner_id: academy.owner_id,
          },
          parent_profile: parentProfile,
          staff_profile: staffProfile,
          current_member_role: currentMemberRole,
        };

        setRoomInfo(computedRoomInfo);

        // Determine if current user can send (프론트에서 입력창 제어 용도)
        let allowedToSend = true;
        if (roleData?.role === 'admin' && roomData.staff_id && currentMemberRole === 'owner') {
          // 원장인데, 담당자가 따로 지정된(staff_id가 자신의 user_id가 아닌) 채팅방이면 읽기 전용
          allowedToSend = roomData.staff_id === session.user.id;
        }
        setCanSend(allowedToSend);

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_room_id', chatRoomId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          logError('ChatMessages Fetch', messagesError);
        } else {
          setMessages(messagesData || []);
        }

        // Mark messages as read
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('chat_room_id', chatRoomId)
          .neq('sender_id', session.user.id);

      } catch (error) {
        logError('ChatMessages Init', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chatRoomId]);

  // Real-time subscription
  useEffect(() => {
    if (!chatRoomId) return;

    const channel = supabase
      .channel(`messages:${chatRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });

          // Mark as read if not from current user
          if (newMessage.sender_id !== userId) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoomId, userId]);

  useEffect(() => {
    if (!roomInfo) return;

    let allowedToSend = true;

    // 관리자(원장/부원장/강사) 쪽 제어: 원장은 자신이 담당자가 아닌 채팅방에서는 읽기 전용
    if (isAdmin && roomInfo.staff_id && roomInfo.current_member_role === 'owner') {
      allowedToSend = roomInfo.staff_id === userId;
    }

    // 학부모가 강사에게 채팅 상담을 요청한 경우:
    // 강사가 아직 한 번도 답장을 보내지 않았다면 학부모는 메시지를 보낼 수 없음
    if (
      isParent &&
      roomInfo.staff_id &&
      roomInfo.staff_profile?.grade_label === '강사'
    ) {
      const hasStaffReply = messages.some(
        (m) => m.sender_id !== roomInfo.parent_id
      );

      if (!hasStaffReply) {
        allowedToSend = false;
      }
    }

    setCanSend(allowedToSend);
  }, [roomInfo, isAdmin, isParent, userId, messages]);

  const sendMessage = useCallback(async (content: string): Promise<{ success: boolean; error?: string }> => {
    if (!chatRoomId || !userId) {
      return { success: false, error: "채팅방 정보가 없습니다" };
    }

    if (!canSend) {
      return { success: false, error: "이 채팅방에서는 메시지를 보낼 수 없습니다" };
    }

    // Validate message content
    const validation = messageSchema.safeParse({ content });
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || "유효하지 않은 메시지입니다";
      logError('ChatMessages Validation', validation.error);
      return { success: false, error: errorMessage };
    }

    const validatedContent = validation.data.content;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoomId,
          sender_id: userId,
          content: validatedContent,
        });

      if (error) {
        logError('ChatMessages Send', error);
        return { success: false, error: "메시지 전송에 실패했습니다" };
      }

      // Update chat room timestamp
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatRoomId);

      return { success: true };
    } catch (error) {
      logError('ChatMessages Send', error);
      return { success: false, error: "오류가 발생했습니다" };
    }
  }, [chatRoomId, userId, canSend]);

  return { messages, roomInfo, loading, userId, isAdmin, canSend, sendMessage };
};
