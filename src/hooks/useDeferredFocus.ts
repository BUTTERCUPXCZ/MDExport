import { useEffect, useRef } from "react";

/**
 * Focuses (and selects) an input once the current interaction has settled —
 * e.g. after a context menu that opened it has closed and released focus.
 * `ready` stays false until then, so an early blur can be ignored.
 */
export function useDeferredFocus<T extends HTMLInputElement>() {
  const ref = useRef<T>(null);
  const ready = useRef(false);

  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        const input = ref.current;
        // Already focused (clicked into, typing): don't reselect the text.
        if (input && document.activeElement !== input) {
          input.focus();
          input.select();
        }
        ready.current = true;
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  return { ref, ready };
}
