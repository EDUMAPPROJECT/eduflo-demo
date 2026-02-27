import { useNavigate } from "react-router-dom";
import { useChatRooms } from "@/hooks/useChatRooms";
import AdminBottomNavigation from "@/components/AdminBottomNavigation";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, User } from "lucide-react";

const ChatManagementPage = () => {
  const navigate = useNavigate();
  const { chatRooms, loading, userId } = useChatRooms(true, "others");

  const isOwnerView = chatRooms.some((room) => room.academy.owner_id === userId);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/home')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Logo size="sm" showText={false} />
          <span className="font-semibold text-foreground">학원 채팅 관리</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {!userId ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <h3 className="font-semibold text-foreground mb-2">로그인이 필요합니다</h3>
              <p className="text-sm text-muted-foreground">
                학원 채팅 관리는 관리자 로그인 후 이용할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        ) : !isOwnerView ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <h3 className="font-semibold text-foreground mb-2">원장만 접근 가능합니다</h3>
              <p className="text-sm text-muted-foreground">
                학원 채팅 관리는 원장 계정에서만 확인할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : chatRooms.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">다른 멤버에게 배정된 채팅이 없습니다</h3>
              <p className="text-sm text-muted-foreground">
                부원장/강사에게 배정된 채팅이 생기면 이곳에서 한 번에 확인할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {chatRooms.map((room) => (
              <Card
                key={room.id}
                className="shadow-card cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/admin/chats/${room.id}`, { state: { from: "chat-management" } })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Parent Icon */}
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                      <User className="w-6 h-6 text-primary" />
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {room.parent_profile?.user_name || '학부모'}
                        </h3>
                        {room.lastMessageAt && (
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">
                            {room.lastMessageAt.toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {room.lastMessage || "새로운 상담"}
                        </p>
                        {room.unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground shrink-0 ml-2 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                            {room.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AdminBottomNavigation />
    </div>
  );
};

export default ChatManagementPage;
