import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { ChevronRight, Heart, Clock, Settings, HelpCircle, LogOut } from "lucide-react";

const MyPage = () => {
  const role = localStorage.getItem("edumap-role") || "parent";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Profile Header */}
      <div className="gradient-primary pt-12 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center shadow-soft">
              <span className="text-2xl font-bold text-primary">U</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-primary-foreground">
                게스트 사용자
              </h2>
              <p className="text-sm text-primary-foreground/80">
                {role === "parent" ? "학부모 회원" : "학원 원장님"}
              </p>
            </div>
            <Button variant="secondary" size="sm" className="bg-card/20 text-primary-foreground border-none hover:bg-card/30">
              로그인
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <main className="max-w-lg mx-auto px-4 -mt-4">
        {/* Quick Stats Card */}
        <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="text-center py-2">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground">찜한 학원</p>
            </div>
            <div className="text-center py-2">
              <p className="text-2xl font-bold text-accent">0</p>
              <p className="text-xs text-muted-foreground">최근 본 학원</p>
            </div>
          </div>
        </div>

        {/* Menu List */}
        <div className="bg-card rounded-2xl shadow-card overflow-hidden mb-4">
          <MenuItemButton icon={Heart} label="찜한 학원" />
          <MenuItemButton icon={Clock} label="최근 본 학원" />
        </div>

        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          <MenuItemButton icon={Settings} label="설정" />
          <MenuItemButton icon={HelpCircle} label="고객센터" />
          <MenuItemButton icon={LogOut} label="로그아웃" variant="destructive" />
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

interface MenuItemButtonProps {
  icon: React.ElementType;
  label: string;
  variant?: "default" | "destructive";
}

const MenuItemButton = ({ icon: Icon, label, variant = "default" }: MenuItemButtonProps) => (
  <button className="w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0">
    <Icon className={`w-5 h-5 ${variant === "destructive" ? "text-destructive" : "text-muted-foreground"}`} />
    <span className={`flex-1 text-left text-sm font-medium ${variant === "destructive" ? "text-destructive" : "text-foreground"}`}>
      {label}
    </span>
    <ChevronRight className="w-4 h-4 text-muted-foreground" />
  </button>
);

export default MyPage;
