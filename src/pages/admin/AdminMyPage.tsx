import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminBottomNavigation from "@/components/AdminBottomNavigation";
import Logo from "@/components/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, Pencil } from "lucide-react";
import { toast } from "sonner";
import NicknameSettingsDialog from "@/components/NicknameSettingsDialog";

const AdminMyPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isNicknameDialogOpen, setIsNicknameDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_name")
          .eq("id", session.user.id)
          .maybeSingle();
        
        setUserName(profile?.user_name || null);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("로그아웃되었습니다");
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("로그아웃에 실패했습니다");
    }
  };

  const handleNicknameUpdate = (newName: string) => {
    setUserName(newName);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size="sm" showText={false} />
          <span className="text-xs font-medium text-primary bg-secondary px-2 py-1 rounded-full">
            관리자 모드
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Profile Section */}
        <Card className="shadow-card border-border mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    {userName || "원장님"}
                  </h2>
                  <button
                    onClick={() => setIsNicknameDialogOpen(true)}
                    className="p-1 hover:bg-secondary rounded-full transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-3">
          <Card 
            className="shadow-card border-border cursor-pointer hover:shadow-soft transition-all duration-200"
            onClick={() => navigate("/admin/profile")}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">학원 프로필 관리</h4>
                <p className="text-sm text-muted-foreground">
                  학원 정보 및 설정을 관리합니다
                </p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="shadow-card border-destructive/20 cursor-pointer hover:shadow-soft transition-all duration-200"
            onClick={handleLogout}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-destructive">로그아웃</h4>
                <p className="text-sm text-muted-foreground">
                  계정에서 로그아웃합니다
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <NicknameSettingsDialog
        open={isNicknameDialogOpen}
        onOpenChange={setIsNicknameDialogOpen}
        currentNickname={userName || ""}
        userId={user?.id || ""}
        onSuccess={handleNicknameUpdate}
      />

      <AdminBottomNavigation />
    </div>
  );
};

export default AdminMyPage;
