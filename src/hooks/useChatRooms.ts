import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ChatRoom {
  id: string;
  academy_id: string;
  parent_id: string;
  staff_id: string | null;
  academy: {
    id: string;
    name: string;
    profile_image: string | null;
    owner_id: string | null;
  };
  parent_profile?: {
    user_name: string | null;
    phone: string | null;
  } | null;
  staff_profile?: {
    display_name: string;
    grade_label: string;
  } | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
}

type OwnerViewMode = "all" | "self" | "others";

export const useChatRooms = (isAdmin: boolean = false, ownerView: OwnerViewMode = "all") => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setLoading(false);
          return;
        }

        setUserId(session.user.id);

        // Get chat rooms with academy info
        const { data: rooms, error } = await supabase
          .from('chat_rooms')
          .select(`
            id,
            academy_id,
            parent_id,
            staff_id,
            updated_at,
            academies (
              id,
              name,
              profile_image,
              owner_id
            )
          `)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error fetching chat rooms:', error);
          setLoading(false);
          return;
        }

        // Get last message and unread count for each room
        const roomsWithMessages = await Promise.all(
          (rooms || []).map(async (room) => {
            // Get last message
            const { data: lastMessageData } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('chat_room_id', room.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Get unread count (messages not from current user that are unread)
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_room_id', room.id)
              .eq('is_read', false)
              .neq('sender_id', session.user.id);

            const academy = room.academies as unknown as { id: string; name: string; profile_image: string | null; owner_id: string | null };

            // Fetch parent profile if admin
            let parentProfile = null;
            if (isAdmin) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('user_name, phone')
                .eq('id', room.parent_id)
                .maybeSingle();
              parentProfile = profileData;
            }

            // Fetch staff profile (원장/부원장/강사 닉네임 및 직책) for parent chat list 구분용
            let staffProfile: ChatRoom["staff_profile"] = null;
            if (!isAdmin && room.staff_id) {
              try {
                const { data: staffList } = await supabase.rpc('get_academy_chat_staff', {
                  p_academy_id: academy.id,
                });
                const matched = (staffList as any[] | null)?.find(
                  (s) => s.user_id === room.staff_id
                );
                if (matched) {
                  staffProfile = {
                    display_name: matched.display_name || '이름 없음',
                    grade_label: matched.grade_label || '',
                  };
                }
              } catch (error) {
                console.error('Error fetching staff profile for chat room:', error);
              }
            }

            return {
              id: room.id,
              academy_id: room.academy_id,
              parent_id: room.parent_id,
              academy: {
                id: academy.id,
                name: academy.name,
                profile_image: academy.profile_image,
                owner_id: academy.owner_id,
              },
              staff_id: room.staff_id ?? null,
              parent_profile: parentProfile,
              staff_profile: staffProfile,
              lastMessage: lastMessageData?.content || null,
              lastMessageAt: lastMessageData?.created_at ? new Date(lastMessageData.created_at) : null,
              unreadCount: unreadCount || 0,
            };
          })
        );

        // Owner 전용 필터링: 채팅 탭에서는 자신의 채팅만, 관리 페이지에서는 다른 멤버 채팅만 보기 등
        let filteredRooms = roomsWithMessages;
        if (isAdmin && userId) {
          if (ownerView === "self") {
            filteredRooms = roomsWithMessages.filter((room) => {
              const isOwner = room.academy.owner_id === userId;
              if (!isOwner) {
                // 부원장/강사 등은 RLS로 이미 자신의 채팅만 보이므로 추가 필터 없음
                return true;
              }
              // 원장: 본인 담당(staff_id = 본인) 또는 담당자 미지정(staff_id NULL)만
              return room.staff_id === userId || room.staff_id === null;
            });
          } else if (ownerView === "others") {
            filteredRooms = roomsWithMessages.filter((room) => {
              const isOwner = room.academy.owner_id === userId;
              if (!isOwner) return false;
              // 원장: 본인을 제외한 다른 직원에게 배정된 채팅만
              return room.staff_id !== null && room.staff_id !== userId;
            });
          }
        }

        setChatRooms(filteredRooms);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, [isAdmin, ownerView]);

  return { chatRooms, loading, userId };
};

export const useOrCreateChatRoom = () => {
  const [loading, setLoading] = useState(false);

  /**
   * Get or create a chat room for the current user and academy.
   * @param academyId - Academy UUID
   * @param staffUserId - Optional. When provided, the room is for chatting with this specific staff (원장/부원장/강사).
   */
  const getOrCreateChatRoom = async (
    academyId: string,
    staffUserId?: string | null,
    requiresTeacherAccept: boolean = false
  ): Promise<string | null> => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return null;
      }

      const parentId = session.user.id;

      // Check if chat room already exists (same academy, parent, and optional staff)
      let query = supabase
        .from('chat_rooms')
        .select('id')
        .eq('academy_id', academyId)
        .eq('parent_id', parentId);

      if (staffUserId) {
        query = query.eq('staff_id', staffUserId);
      } else {
        query = query.is('staff_id', null);
      }

      const { data: existingRoom } = await query.maybeSingle();

      if (existingRoom) {
        return existingRoom.id;
      }

      // Create new chat room
      const insertPayload: { academy_id: string; parent_id: string; staff_id?: string | null } = {
        academy_id: academyId,
        parent_id: parentId,
      };
      if (staffUserId) {
        insertPayload.staff_id = staffUserId;
      } else {
        insertPayload.staff_id = null;
      }

      const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert(insertPayload)
        .select('id')
        .single();

      if (error || !newRoom) {
        console.error('Error creating chat room:', error);
        return null;
      }

      // If this chat is with a teacher, create an initial system-like request message
      if (requiresTeacherAccept && staffUserId) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_name')
            .eq('id', parentId)
            .maybeSingle();

          const parentName = profile?.user_name || '학부모';
          const content = `${parentName}님이 선생님에게 채팅 상담 요청을 보냈습니다. 수락을 통해 채팅 진행 여부를 결정해주세요`;

          await supabase.from('messages').insert({
            chat_room_id: newRoom.id,
            sender_id: parentId,
            content,
          });
        } catch (messageError) {
          console.error('Error creating initial teacher request message:', messageError);
        }
      }

      return newRoom.id;
    } catch (error) {
      console.error('Error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { getOrCreateChatRoom, loading };
};
