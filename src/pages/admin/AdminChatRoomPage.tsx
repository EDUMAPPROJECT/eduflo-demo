import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useChatMessages } from "@/hooks/useChatMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminChatRoomPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { messages, roomInfo, loading, userId, isAdmin, canSend, sendMessage } = useChatMessages(id);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const result = await sendMessage(newMessage);
    if (result.success) {
      setNewMessage("");
    } else if (result.error) {
      toast.error(result.error);
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!roomInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">채팅방을 찾을 수 없습니다</p>
      </div>
    );
  }

  const parentName = roomInfo.parent_profile?.user_name || '학부모';
  const parentPhone = roomInfo.parent_profile?.phone;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              (location.state as { from?: string })?.from === "chat-management"
                ? navigate("/admin/chat-management")
                : navigate("/admin/chats")
            }
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{parentName}</h1>
            {parentPhone && (
              <p className="text-xs text-muted-foreground truncate">{parentPhone}</p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">관리자</Badge>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">아직 메시지가 없습니다</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMe = message.sender_id === userId;
              const isTeacherStaff =
                roomInfo.staff_profile?.grade_label === "강사" &&
                roomInfo.staff_id === userId;
              const hasStaffReply = messages.some(
                (m) => m.sender_id !== roomInfo.parent_id
              );

              if (isMe) {
                // 관리자(나)의 메시지
                return (
                  <div
                    key={message.id}
                    className="flex justify-end"
                  >
                    <div className="max-w-[75%] rounded-2xl px-4 py-2.5 bg-primary text-primary-foreground rounded-tr-sm">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs mt-1 text-primary-foreground/70">
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              }

              // 학부모 메시지 (왼쪽, 아바타 + 이름 한 줄, 그 아래 말풍선)
              return (
                <div
                  key={message.id}
                  className="flex justify-start"
                >
                  <div className="flex gap-2 max-w-[85%]">
                    {/* 학부모 아바타 */}
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    {/* 닉네임 + 말풍선 */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground truncate">
                          {parentName}
                        </p>
                      </div>
                      <div className="max-w-full rounded-2xl px-4 py-2.5 bg-secondary text-foreground rounded-tl-sm">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          {formatTime(message.created_at)}
                        </p>
                        {/* 강사 채팅 상담 요청 수락 버튼 (첫 메시지 + 아직 답장 없음 + 담당 강사 본인인 경우) */}
                        {index === 0 && isTeacherStaff && !hasStaffReply && (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={sending}
                              onClick={async () => {
                                if (sending) return;
                                setSending(true);
                                const result = await sendMessage(
                                  "상담 요청을 수락했습니다. 지금부터 채팅을 시작할 수 있습니다."
                                );
                                if (!result.success && result.error) {
                                  toast.error(result.error);
                                }
                                setSending(false);
                              }}
                            >
                              채팅 상담 수락
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-card border-t border-border p-4">
        <div className="max-w-lg mx-auto flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="메시지를 입력하세요..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 rounded-full"
              disabled={sending || !canSend}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || !canSend}
              className="rounded-full shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {!canSend && (
            <p className="text-xs text-muted-foreground">
              이 채팅방에서는 읽기만 가능합니다. 담당자로 지정된 직원만 답변할 수 있어요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatRoomPage;
