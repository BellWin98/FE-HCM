import { useEffect, useRef, useState } from 'react';

export const useInView = <T extends HTMLElement = HTMLElement>(
  options?: IntersectionObserverInit
) => {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!ref.current || isInView) {
      return;
    }

    const opts = { threshold: 0.15, ...optionsRef.current };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      opts
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [isInView]);

  return { ref, isInView };
};
