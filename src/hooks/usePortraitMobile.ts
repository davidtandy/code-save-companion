import { useEffect, useState } from "react";

export function usePortraitMobile(phoneMaxWidth = 820): boolean {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(orientation: portrait)").matches && window.innerWidth <= phoneMaxWidth;
  });

  useEffect(() => {
    const check = () => {
      setValue(
        window.matchMedia("(orientation: portrait)").matches && window.innerWidth <= phoneMaxWidth,
      );
    };
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, [phoneMaxWidth]);

  return value;
}
