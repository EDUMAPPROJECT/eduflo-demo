import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import MyClassList from "@/components/MyClassList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const MyClassesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground">MY CLASS</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        <MyClassList />
      </main>

      <BottomNavigation />
    </div>
  );
};

export default MyClassesPage;
