import { useCallback, useRef } from "react";

export function useRovingFocus(count: number) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = itemRefs.current.findIndex(
        (ref) => ref === document.activeElement
      );
      if (currentIndex === -1) return;

      let nextIndex: number | null = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        nextIndex = (currentIndex + 1) % count;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        nextIndex = (currentIndex - 1 + count) % count;
      }

      if (nextIndex !== null) {
        itemRefs.current[nextIndex]?.focus();
      }
    },
    [count]
  );

  return { itemRefs, handleKeyDown };
}
