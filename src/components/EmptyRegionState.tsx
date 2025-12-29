import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface EmptyRegionStateProps {
  region: string;
  onRegionChange: (region: string) => void;
}

const suggestedRegions = ["대치동", "목동", "분당"];

const EmptyRegionState = ({ region, onRegionChange }: EmptyRegionStateProps) => {
  const otherRegions = suggestedRegions.filter(r => r !== region);

  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
        <MapPin className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">
        아직 우리 동네에 등록된 정보가 없어요
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        다른 지역을 구경해보시겠어요?
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {otherRegions.map((r) => (
          <Button
            key={r}
            variant="outline"
            size="sm"
            onClick={() => onRegionChange(r)}
            className="gap-1"
          >
            <MapPin className="w-3 h-3" />
            {r}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default EmptyRegionState;