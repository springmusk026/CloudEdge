import { useMemo, useState, useEffect } from 'react';
import { List } from 'lucide-react';

interface TocItem { id: string; text: string; level: number }

export function StickyTOC({ html }: { html: string }) {
  const [activeId, setActiveId] = useState('');

  const headings = useMemo(() => {
    const items: TocItem[] = [];
    const regex = /<h([23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      items.push({ id: match[2], text: match[3].replace(/<[^>]*>/g, ''), level: parseInt(match[1]) });
    }
    return items;
  }, [html]);

  useEffect(() => {
    if (headings.length < 2) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) { if (entry.isIntersecting) setActiveId(entry.target.id); }
    }, { rootMargin: '-80px 0px -60% 0px' });
    headings.forEach(h => { const el = document.getElementById(h.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <nav className="hidden xl:block fixed right-[max(1rem,calc((100vw-768px)/2-280px))] top-24 w-56">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <List size={12} /> On this page
      </h4>
      <ul className="space-y-1 border-l">
        {headings.map(h => (
          <li key={h.id} className={h.level === 3 ? 'ml-3' : ''}>
            <a href={`#${h.id}`}
              className={`block pl-3 py-0.5 text-xs border-l-2 -ml-px transition-colors ${activeId === h.id ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
