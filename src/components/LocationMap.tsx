import { Button } from "@/components/ui/button";
import { Navigation, MapPin } from "lucide-react";

interface LocationMapProps {
  address: string;
  name: string;
}

const LocationMap = ({ address, name }: LocationMapProps) => {
  const openNaverMap = () => {
    const url = `https://map.naver.com/p/search/${encodeURIComponent(address)}`;
    window.open(url, "_blank");
  };

  const openKakaoMap = () => {
    const url = `https://map.kakao.com/?q=${encodeURIComponent(address)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-3">
      <div className="w-full py-6 rounded-lg bg-secondary/30 flex flex-col items-center justify-center gap-2">
        <MapPin className="w-8 h-8 text-primary" />
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs text-muted-foreground text-center px-4">{address}</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={openNaverMap}
        >
          <Navigation className="w-4 h-4" />
          네이버 지도
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={openKakaoMap}
        >
          <Navigation className="w-4 h-4" />
          카카오맵
        </Button>
      </div>
    </div>
  );
};

export default LocationMap;
