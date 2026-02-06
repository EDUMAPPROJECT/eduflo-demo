/**
 * 카카오(다음) 우편번호 서비스 API 타입 선언
 * @see https://postcode.map.daum.net/guide
 */
export interface DaumPostcodeData {
  zonecode: string;
  address: string;
  addressEnglish: string;
  addressType: "R" | "J";
  userSelectedType: "R" | "J";
  roadAddress: string;
  roadAddressEnglish: string;
  jibunAddress: string;
  jibunAddressEnglish: string;
  buildingName: string;
  apartment: string;
  bname: string;
  sigungu: string;
  sido: string;
  [key: string]: string | undefined;
}

export interface DaumPostcodeOptions {
  oncomplete?: (data: DaumPostcodeData) => void;
  onclose?: (state: "FORCE_CLOSE" | "COMPLETE_CLOSE") => void;
  onresize?: (size: { width: number; height: number }) => void;
  width?: number | string;
  height?: number | string;
  theme?: Record<string, string>;
}

export interface DaumPostcodeInstance {
  open(options?: { q?: string; left?: number; top?: number; popupTitle?: string; popupKey?: string; autoClose?: boolean }): void;
  embed(element: HTMLElement, options?: { q?: string; autoClose?: boolean }): void;
}

export interface DaumPostcodeConstructor {
  new (options: DaumPostcodeOptions): DaumPostcodeInstance;
}

declare global {
  interface Window {
    daum?: {
      Postcode: DaumPostcodeConstructor;
    };
    kakao?: {
      Postcode: DaumPostcodeConstructor;
    };
  }
}

export {};