import { useState, useEffect } from 'react';

export function ReadingTimeProgress({ totalMinutes }: { totalMinutes: number }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const elapsed = Math.max(1, Math.round(progress * totalMinutes));

  if (totalMinutes <= 1) return null;

  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {elapsed} of {totalMinutes} min read
    </span>
  );
}
