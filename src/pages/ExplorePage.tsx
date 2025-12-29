import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Filter, Star } from "lucide-react";

const ExplorePage = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Search */}
      <header className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="학원명, 과목으로 검색"
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted border-none text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Map Area (Placeholder) */}
      <div className="h-48 bg-secondary/50 flex items-center justify-center border-b border-border">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">지도에서 학원 찾기</p>
        </div>
      </div>

      {/* Filter Tags */}
      <div className="max-w-lg mx-auto px-4 py-3 border-b border-border">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {["전체", "수학", "영어", "국어", "과학", "예체능", "코딩"].map((tag, idx) => (
            <Button
              key={tag}
              variant={idx === 0 ? "default" : "outline"}
              size="sm"
              className="shrink-0"
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      <main className="max-w-lg mx-auto px-4 py-4">
        <p className="text-sm text-muted-foreground mb-4">
          총 <span className="text-primary font-semibold">24개</span> 학원
        </p>

        <div className="space-y-3">
          {[
            { name: "스마트 수학학원", subject: "수학", rating: 4.7, reviews: 128, distance: "250m" },
            { name: "잉글리시타운", subject: "영어", rating: 4.5, reviews: 95, distance: "400m" },
            { name: "창의력 과학교실", subject: "과학", rating: 4.8, reviews: 67, distance: "600m" },
            { name: "논술왕 국어학원", subject: "국어", rating: 4.6, reviews: 82, distance: "750m" },
          ].map((academy, idx) => (
            <div
              key={idx}
              className="bg-card border border-border rounded-xl p-4 shadow-card hover:shadow-soft transition-all duration-200"
            >
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-primary">
                    {academy.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">{academy.name}</h4>
                  <p className="text-sm text-muted-foreground">{academy.subject} 전문</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium text-foreground">{academy.rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">리뷰 {academy.reviews}</span>
                    <span className="text-xs text-muted-foreground">• {academy.distance}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default ExplorePage;
