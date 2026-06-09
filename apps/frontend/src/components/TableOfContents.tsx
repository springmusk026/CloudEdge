import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { List } from 'lucide-react';

interface TocItem { id: string; text: string; level: number }

export function TableOfContents({ html }: { html: string }) {
  const headings = useMemo(() => {
    const items: TocItem[] = [];
    const regex = /<h([23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>|<h([23])[^>]*>(.*?)<\/h[23]>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const level = parseInt(match[1] || match[4]);
      const text = (match[3] || match[5] || '').replace(/<[^>]*>/g, '');
      const id = (match[2] || text.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      items.push({ id, text, level });
    }
    return items;
  }, [html]);

  if (headings.length < 2) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-muted/50 border mb-8"
    >
      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <List size={14} /> Table of Contents
      </h4>
      <ul className="space-y-1.5">
        {headings.map((h, i) => (
          <li key={i} className={h.level === 3 ? 'ml-4' : ''}>
            <a href={`#${h.id}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}
