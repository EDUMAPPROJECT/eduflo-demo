import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { useClassEnrollments, parseSchedule, CLASS_COLORS } from "@/hooks/useClassEnrollments";

interface ScheduleBlock {
  classId: string;
  className: string;
  academyName: string;
  day: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  colorIndex: number;
}

const TimetablePage = () => {
  const navigate = useNavigate();
  const { enrollments, loading } = useClassEnrollments();

  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const hours = Array.from({ length: 14 }, (_, i) => i + 9); // 09:00 ~ 22:00

  // Parse all enrolled class schedules into blocks
  const scheduleBlocks: ScheduleBlock[] = [];
  
  enrollments.forEach((enrollment, colorIndex) => {
    const schedule = parseSchedule(enrollment.class?.schedule || null);
    if (!schedule) return;

    schedule.days.forEach((day) => {
      scheduleBlocks.push({
        classId: enrollment.class_id,
        className: enrollment.class?.name || "강좌",
        academyName: enrollment.class?.academy?.name || "학원",
        day,
        startHour: schedule.startHour,
        startMinute: schedule.startMinute,
        endHour: schedule.endHour,
        endMinute: schedule.endMinute,
        colorIndex,
      });
    });
  });

  // Get blocks for a specific day and hour
  const getBlocksForCell = (day: string, hour: number) => {
    return scheduleBlocks.filter(
      (block) =>
        block.day === day &&
        block.startHour <= hour &&
        block.endHour > hour
    );
  };

  // Check if this is the starting cell for a block
  const isStartingCell = (block: ScheduleBlock, hour: number) => {
    return block.startHour === hour;
  };

  // Calculate block height in cells
  const getBlockHeight = (block: ScheduleBlock) => {
    const durationHours = block.endHour - block.startHour;
    return durationHours;
  };

  const dayToIndex = (day: string) => days.indexOf(day);

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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
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
                {hours.map((hour) => {
                  // Convert to 12-hour format (just the number)
                  const displayHour = hour > 12 ? hour - 12 : hour;
                  
                  return (
                    <div key={hour} className="relative">
                      {/* Time Label - Straddling the top border */}
                      <div className="absolute left-0 top-0 w-10 -translate-y-1/2 text-right pr-2 z-10">
                        <span className="text-xs text-gray-400">{displayHour}</span>
                      </div>
                      
                      {/* Grid Row */}
                      <div className="grid grid-cols-[40px_repeat(7,1fr)] border-t border-border">
                        <div className="h-12" /> {/* Empty space for time label */}
                        {days.map((day, dayIdx) => {
                          const blocks = getBlocksForCell(day, hour);
                          const startingBlock = blocks.find((b) => isStartingCell(b, hour));
                          
                          return (
                            <div
                              key={`${day}-${hour}`}
                              className="h-12 border-l border-border relative"
                            >
                              {startingBlock && (
                                <div
                                  className={`absolute left-0.5 right-0.5 top-0 z-20 rounded-md overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] ${CLASS_COLORS[startingBlock.colorIndex % CLASS_COLORS.length].bg}`}
                                  style={{
                                    height: `${getBlockHeight(startingBlock) * 48 - 2}px`,
                                  }}
                                  onClick={() => navigate(`/academy/${enrollments.find(e => e.class_id === startingBlock.classId)?.class?.academy?.id}`)}
                                >
                                  <div className={`p-1 h-full flex flex-col ${CLASS_COLORS[startingBlock.colorIndex % CLASS_COLORS.length].text}`}>
                                    <p className="text-[10px] font-semibold leading-tight line-clamp-2">
                                      {startingBlock.className}
                                    </p>
                                    <p className="text-[8px] opacity-80 mt-auto truncate">
                                      {startingBlock.academyName}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {/* Bottom border line */}
                <div className="border-t border-border" />
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        {scheduleBlocks.length > 0 && (
          <div className="mt-4 p-3 bg-card rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-2">등록된 강좌</p>
            <div className="flex flex-wrap gap-2">
              {enrollments.map((enrollment, idx) => (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-1.5"
                >
                  <div
                    className={`w-3 h-3 rounded-sm ${CLASS_COLORS[idx % CLASS_COLORS.length].bg}`}
                  />
                  <span className="text-xs text-foreground">
                    {enrollment.class?.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          {scheduleBlocks.length === 0 
            ? "MY CLASS에 강좌를 등록하면 시간표에 표시됩니다"
            : "강좌를 클릭하면 학원 상세 페이지로 이동합니다"}
        </p>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default TimetablePage;
