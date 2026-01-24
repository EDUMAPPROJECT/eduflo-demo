import { useEffect, useRef, useState } from "react";
import { loadNaverMapScript } from "@/utils/naverMap";
import { MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const AcademyMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setError("네이버 지도 API 키가 설정되지 않았습니다. .env 파일에 VITE_NAVER_MAP_CLIENT_ID를 설정해주세요.");
      setIsLoading(false);
      return;
    }

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await loadNaverMapScript(clientId);

        if (!mapRef.current || !window.naver?.maps || !window.naver.maps.Map) {
          throw new Error("네이버 지도 API를 초기화할 수 없습니다.");
        }

        new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(37.3200, 127.1100), // 동탄4동 중심 좌표
          zoom: 14,
          logoControl: false, // 네이버 로고 숨기기
        });

        setIsLoading(false);
      } catch (err: any) {
        setError(err?.message || "지도를 불러오는 중 오류가 발생했습니다.");
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [clientId]);

  if (error) {
    return (
      <div className="max-w-lg mx-auto border-b border-border">
        <div className="h-64 bg-secondary/50 flex flex-col items-center justify-center p-4">
          <MapPin className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2 whitespace-pre-line text-center">
            {error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              setIsLoading(true);
            }}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto border-b border-border relative z-0">
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-secondary/50 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">지도 로딩 중...</span>
            </div>
          </div>
        )}
        <div
          ref={mapRef}
          className="w-full h-64 relative z-0"
          style={{ minHeight: "256px" }}
        />
      </div>
    </div>
  );
};

export default AcademyMap;