import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";

const TimetablePage = () => {
  const navigate = useNavigate();

  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const hours = Array.from({ length: 14 }, (_, i) => i + 9); // 09:00 ~ 22:00

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">시간표</h1>
        </div>
      </header>

      {/* Weekly Calendar */}
      <main className="max-w-lg mx-auto py-4 px-2">
        <div className="overflow-x-auto">
          <div className="min-w-[360px]">
            {/* Days Header */}
            <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-border">
              <div className="p-2" />
              {days.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-xs font-medium text-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Time Slots with Time-Tick Layout */}
            <div className="relative">
              {hours.map((hour, index) => {
                // Convert to 12-hour format (just the number)
                const displayHour = hour > 12 ? hour - 12 : hour;
                
                return (
                  <div key={hour} className="relative">
                    {/* Time Label - Straddling the top border */}
                    <div className="absolute left-0 top-0 w-10 -translate-y-1/2 text-right pr-2">
                      <span className="text-xs text-gray-400">{displayHour}</span>
                    </div>
                    
                    {/* Grid Row */}
                    <div className="grid grid-cols-[40px_repeat(7,1fr)] border-t border-border">
                      <div className="h-12" /> {/* Empty space for time label */}
                      {days.map((day) => (
                        <div
                          key={`${day}-${hour}`}
                          className="h-12 border-l border-border hover:bg-primary/5 transition-colors cursor-pointer"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {/* Bottom border line */}
              <div className="border-t border-border" />
            </div>
          </div>
        </div>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          수업 일정을 등록하면 이곳에 표시됩니다
        </p>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default TimetablePage;
