import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ChevronRight, Calendar, Clock, Building2 } from "lucide-react";

interface Seminar {
  id: string;
  title: string;
  date: string;
  status: "recruiting" | "closed";
  academy?: {
    name: string;
  };
}

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loadingSeminars, setLoadingSeminars] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    fetchUpcomingSeminars();

    return () => subscription.unsubscribe();
  }, []);

  const fetchUpcomingSeminars = async () => {
    try {
      const { data, error } = await supabase
        .from("seminars")
        .select(`
          id,
          title,
          date,
          status,
          academy:academies (
            name
          )
        `)
        .eq("status", "recruiting")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(5);

      if (error) throw error;
      setSeminars((data as any) || []);
    } catch (error) {
      console.error("Error fetching seminars:", error);
    } finally {
      setLoadingSeminars(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="text-sm">서울시 강남구</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Search Banner */}
        <div className="gradient-primary rounded-2xl p-5 mb-6 shadow-soft">
          <h2 className="text-primary-foreground font-semibold text-lg mb-2">
            어떤 학원을 찾고 계세요?
          </h2>
          <p className="text-primary-foreground/80 text-sm mb-4">
            과목, 위치, 특징으로 검색해보세요
          </p>
          <Button 
            variant="secondary" 
            className="w-full bg-card text-foreground hover:bg-card/90"
            onClick={() => navigate("/explore")}
          >
            학원 검색하기
          </Button>
        </div>

        {/* Quick Categories */}
        <section className="mb-8">
          <h3 className="font-semibold text-foreground mb-4">인기 과목</h3>
          <div className="grid grid-cols-4 gap-3">
            {["수학", "영어", "국어", "과학"].map((subject) => (
              <button
                key={subject}
                onClick={() => navigate(`/explore?subject=${subject}`)}
                className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary hover:bg-secondary/30 transition-all duration-200 shadow-card"
              >
                <span className="text-sm font-medium text-foreground">{subject}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Upcoming Seminars */}
        {seminars.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">🎓 놓치면 안 될 이번 달 설명회</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary text-sm"
                onClick={() => navigate("/explore?tab=seminars")}
              >
                더보기 <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {loadingSeminars ? (
                <div className="flex items-center justify-center w-full py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : (
                seminars.map((seminar) => (
                  <div
                    key={seminar.id}
                    onClick={() => navigate(`/seminar/${seminar.id}`)}
                    className="min-w-[200px] bg-card border border-border rounded-xl overflow-hidden shadow-card hover:shadow-soft transition-all duration-200 cursor-pointer shrink-0"
                  >
                    {/* Thumbnail placeholder */}
                    <div className="h-24 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    <div className="p-3">
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {seminar.status === "recruiting" ? "모집중" : "마감"}
                      </Badge>
                      <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-2">
                        {seminar.title}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(seminar.date)} {formatTime(seminar.date)}</span>
                      </div>
                      {seminar.academy && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{seminar.academy.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Nearby Academies */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">내 주변 인기 학원</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary text-sm"
              onClick={() => navigate("/explore")}
            >
              더보기 <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {[
              { name: "청담 수학학원", subject: "수학", rating: 4.8, distance: "350m" },
              { name: "영어나라 어학원", subject: "영어", rating: 4.6, distance: "500m" },
              { name: "한솔 국어논술", subject: "국어", rating: 4.9, distance: "800m" },
            ].map((academy, idx) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-card hover:shadow-soft transition-all duration-200 cursor-pointer"
                onClick={() => navigate("/explore")}
              >
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {academy.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{academy.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{academy.subject}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {academy.rating}
                    </span>
                    <span>•</span>
                    <span>{academy.distance}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default HomePage;
