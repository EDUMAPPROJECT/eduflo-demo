import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";

interface LocationMapProps {
  address: string;
  name: string;
}

const LocationMap = ({ address, name }: LocationMapProps) => {
  const encodedAddress = encodeURIComponent(address);
  const googleMapsEmbedUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

  const openNaverMap = () => {
    const url = `https://map.naver.com/p/search/${encodedAddress}`;
    window.open(url, "_blank");
  };

  const openKakaoMap = () => {
    const url = `https://map.kakao.com/?q=${encodedAddress}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-3">
      <div className="w-full h-48 rounded-lg overflow-hidden border border-border">
        <iframe
          src={googleMapsEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${name} 위치`}
        />
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
