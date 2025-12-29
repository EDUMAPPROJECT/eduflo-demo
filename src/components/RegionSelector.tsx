import { useState } from "react";
import { ChevronDown, MapPin, Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface RegionSelectorProps {
  selectedRegion: string;
  onRegionChange: (region: string) => void;
}

const regions = [
  { id: "대치동", name: "대치동", description: "강남구" },
  { id: "목동", name: "목동", description: "양천구" },
  { id: "중계동", name: "중계동", description: "노원구" },
  { id: "분당", name: "분당", description: "성남시" },
  { id: "평촌", name: "평촌", description: "안양시" },
  { id: "일산", name: "일산", description: "고양시" },
];

const RegionSelector = ({ selectedRegion, onRegionChange }: RegionSelectorProps) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (regionId: string) => {
    onRegionChange(regionId);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 px-2 font-semibold text-foreground hover:bg-accent"
        >
          <MapPin className="w-4 h-4 text-primary" />
          <span>{selectedRegion}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-card">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle className="text-center">지역 선택</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 pb-8 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground mb-4">
            주요 교육 특구를 선택해주세요
          </p>
          <div className="grid grid-cols-2 gap-3">
            {regions.map((region) => (
              <button
                key={region.id}
                onClick={() => handleSelect(region.id)}
                className={`
                  flex items-center justify-between p-4 rounded-xl border-2 transition-all
                  ${selectedRegion === region.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-accent"
                  }
                `}
              >
                <div className="text-left">
                  <p className="font-semibold text-foreground">{region.name}</p>
                  <p className="text-xs text-muted-foreground">{region.description}</p>
                </div>
                {selectedRegion === region.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default RegionSelector;