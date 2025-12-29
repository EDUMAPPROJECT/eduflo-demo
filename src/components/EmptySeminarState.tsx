import { useNavigate } from "react-router-dom";
import { CalendarOff, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const recommendedAcademies = [
  { name: "청담 수학학원", subject: "수학", rating: 4.8 },
  { name: "영어나라 어학원", subject: "영어", rating: 4.6 },
  { name: "한솔 국어논술", subject: "국어", rating: 4.9 },
];

const EmptySeminarState = () => {
  const navigate = useNavigate();

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
          <CalendarOff className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          현재 준비 중인 설명회가 없습니다
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          관심 학원을 찜하고 새로운 설명회 소식을 기다려보세요!
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground px-1">추천 학원</h4>
        {recommendedAcademies.map((academy, idx) => (
          <div
            key={idx}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-card hover:shadow-soft transition-all duration-200 cursor-pointer"
            onClick={() => navigate("/explore")}
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <span className="text-lg font-bold text-primary">
                {academy.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-foreground">{academy.name}</h5>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{academy.subject}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {academy.rating}
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/explore")}
        >
          모든 학원 둘러보기
        </Button>
      </div>
    </div>
  );
};

export default EmptySeminarState;
