import { MutableRef, useEffect } from "preact/hooks";

export function useClickOutside(ref: MutableRef<HTMLElement | null>, onClickOutside: () => void) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // @ts-ignore
      if (ref.current && !ref.current.contains(event.target)) onClickOutside(event);
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, onClickOutside]);
}
