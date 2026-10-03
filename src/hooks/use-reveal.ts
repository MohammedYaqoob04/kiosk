import { useEffect, useRef, useState } from "react";

export function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setRevealed(true);
        observer.disconnect();
      },
      { threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, revealed };
}
