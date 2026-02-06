import { useEffect, useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Search, X } from "lucide-react";
import type { DaumPostcodeData } from "@/types/daum-postcode";

const KAKAO_POSTCODE_SCRIPT_URL =
  "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

interface AddressSearchProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
}

function loadPostcodeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.Postcode || window.daum?.Postcode) {
      resolve();
      return;
    }
    const existing = document.querySelector(
      `script[src="${KAKAO_POSTCODE_SCRIPT_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = KAKAO_POSTCODE_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("카카오 주소 검색 스크립트 로드 실패"));
    document.head.appendChild(script);
  });
}

const AddressSearch = ({
  value,
  onChange,
  placeholder = "주소 입력",
}: AddressSearchProps) => {
  const [baseAddress, setBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [showPostcode, setShowPostcode] = useState(false);
  const baseInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);
  const postcodeLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isInitialized) return;

    if (value) {
      const commaIndex = value.lastIndexOf(", ");
      if (commaIndex > 0) {
        setBaseAddress(value.substring(0, commaIndex));
        setDetailAddress(value.substring(commaIndex + 2));
      } else {
        setBaseAddress(value);
        setDetailAddress("");
      }
    }
    setIsInitialized(true);
  }, [value, isInitialized]);

  const updateParent = useCallback(
    (base: string, detail: string) => {
      const fullAddress = base
        ? detail
          ? `${base}, ${detail}`
          : base
        : "";
      onChange(fullAddress);
    },
    [onChange]
  );

  const handleAddressComplete = useCallback(
    (data: DaumPostcodeData) => {
      let addr = "";
      let extraAddr = "";

      if (data.userSelectedType === "R") {
        addr = data.roadAddress ?? "";
        if (data.bname && /[동|로|가]$/g.test(data.bname)) {
          extraAddr += data.bname;
        }
        if (data.buildingName && data.apartment === "Y") {
          extraAddr += extraAddr ? `, ${data.buildingName}` : data.buildingName;
        }
        if (extraAddr) {
          extraAddr = ` (${extraAddr})`;
        }
      } else {
        addr = data.jibunAddress ?? "";
      }

      const fullBase = addr + extraAddr;
      setBaseAddress(fullBase);
      updateParent(fullBase, detailAddress);
      setShowPostcode(false);
      baseInputRef.current?.blur();
      setTimeout(() => detailInputRef.current?.focus(), 100);
    },
    [detailAddress, updateParent]
  );

  const openPostcode = useCallback(() => {
    baseInputRef.current?.blur();
    setScriptError(null);
    setShowPostcode(true);
  }, []);

  useEffect(() => {
    if (!showPostcode || !postcodeLayerRef.current) return;

    const layer = postcodeLayerRef.current;
    layer.style.display = "block";

    loadPostcodeScript()
      .then(() => {
        if (!layer.isConnected) return;
        const Postcode = window.kakao?.Postcode ?? window.daum?.Postcode;
        if (!Postcode) {
          setScriptError("주소 검색 API를 사용할 수 없습니다.");
          setShowPostcode(false);
          return;
        }
        new Postcode({
          oncomplete: handleAddressComplete,
          width: "100%",
          height: "100%",
        }).embed(layer, { autoClose: true });
      })
      .catch((err) => {
        setScriptError(err instanceof Error ? err.message : "스크립트 로드 실패");
        setShowPostcode(false);
      });

    return () => {
      layer.style.display = "none";
      layer.innerHTML = "";
    };
  }, [showPostcode, handleAddressComplete]);

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDetail = e.target.value;
    setDetailAddress(newDetail);
    updateParent(baseAddress, newDetail);
  };

  return (
    <div className="space-y-3">
      {showPostcode && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-background/95"
          role="dialog"
          aria-label="주소 검색"
        >
          <div className="flex items-center justify-between shrink-0 border-b px-4 py-2">
            <span className="text-sm font-medium">주소 검색</span>
            <button
              type="button"
              onClick={() => setShowPostcode(false)}
              className="rounded p-1 hover:bg-muted"
              aria-label="검색창 닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div
            ref={postcodeLayerRef}
            className="flex-1 min-h-0 w-full"
            style={{ display: "none" }}
          />
        </div>
      )}

      <div className="relative">
        <Input
          ref={baseInputRef}
          value={baseAddress}
          readOnly
          placeholder={placeholder}
          className="w-full pr-10 cursor-pointer"
          onFocus={openPostcode}
          onClick={openPostcode}
          aria-label="주소 검색 (클릭 시 검색창 열림)"
        />
        <Search
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          aria-hidden
        />
      </div>
      {scriptError && (
        <p className="text-xs text-destructive">{scriptError}</p>
      )}

      <Input
        ref={detailInputRef}
        value={detailAddress}
        onChange={handleDetailChange}
        placeholder="상세 주소 입력 (예: 3층 301호)"
        className="w-full"
      />

      {(baseAddress || detailAddress) && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          {baseAddress
            ? detailAddress
              ? `${baseAddress}, ${detailAddress}`
              : baseAddress
            : detailAddress}
        </p>
      )}
    </div>
  );
};

export default AddressSearch;