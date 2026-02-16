import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Available regions for the alpha test (동탄 신도시)
export const AVAILABLE_REGIONS = {
  "동탄 1신도시": [
    { id: "dongtan1", name: "동탄1동", district: "화성시" },
    { id: "dongtan2", name: "동탄2동", district: "화성시" },
    { id: "dongtan3", name: "동탄3동", district: "화성시" },
  ],
  "동탄 2신도시": [
    { id: "dongtan4", name: "동탄4동", district: "화성시" },
    { id: "dongtan5", name: "동탄5동", district: "화성시" },
    { id: "dongtan6", name: "동탄6동", district: "화성시" },
    { id: "dongtan7", name: "동탄7동", district: "화성시" },
    { id: "dongtan8", name: "동탄8동", district: "화성시" },
    { id: "dongtan9", name: "동탄9동", district: "화성시" },
  ],
};

export const ALL_REGIONS = Object.values(AVAILABLE_REGIONS).flat();

interface RegionContextType {
  selectedRegion: string;
  selectedRegionName: string;
  setSelectedRegion: (regionId: string) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

const STORAGE_KEY = "eduflo_selected_region";

/** 지역 미선택/전체일 때 사용하는 값. 이 값이면 지역 필터 없이 전체 목록 표시 */
export const REGION_ALL = "all";

export const RegionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedRegion, setSelectedRegionState] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || REGION_ALL; // 기본값: 전체 (지역 설정 없어도 설명회 등 목록 표시)
  });

  const selectedRegionName =
    selectedRegion === REGION_ALL
      ? "전체"
      : ALL_REGIONS.find((r) => r.id === selectedRegion)?.name || "전체";

  const setSelectedRegion = (regionId: string) => {
    setSelectedRegionState(regionId);
    localStorage.setItem(STORAGE_KEY, regionId);
  };

  return (
    <RegionContext.Provider value={{ selectedRegion, selectedRegionName, setSelectedRegion }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error("useRegion must be used within a RegionProvider");
  }
  return context;
};
