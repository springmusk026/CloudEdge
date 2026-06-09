import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Post } from '@/lib/types';

export function PostNavigation({ currentSlug }: { currentSlug: string }) {
  const { data } = useQuery({
    queryKey: ['post-nav', currentSlug],
    queryFn: async () => {
      const res = await fetch('/api/v1/posts?limit=100');
      const { posts } = await res.json() as { posts: Post[] };
      const sorted = posts.filter(p => p.publishedAt).sort((a, b) => (a.publishedAt! > b.publishedAt! ? 1 : -1));
      const idx = sorted.findIndex(p => p.slug === currentSlug);
      return { prev: idx > 0 ? sorted[idx - 1] : null, next: idx < sorted.length - 1 ? sorted[idx + 1] : null };
    },
  });

  if (!data?.prev && !data?.next) return null;

  return (
    <nav className="flex items-stretch gap-4 mt-12 pt-8 border-t">
      {data.prev ? (
        <Link to={`/${data.prev.slug}`} className="flex-1 group p-4 rounded-xl border hover:border-primary/30 transition-colors">
          <span className="flex items-center gap-1 text-xs text-muted-foreground mb-1"><ChevronLeft size={12} /> Previous</span>
          <span className="text-sm font-medium group-hover:text-primary transition-colors">{data.prev.title}</span>
        </Link>
      ) : <div className="flex-1" />}
      {data.next ? (
        <Link to={`/${data.next.slug}`} className="flex-1 group p-4 rounded-xl border hover:border-primary/30 transition-colors text-right">
          <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground mb-1">Next <ChevronRight size={12} /></span>
          <span className="text-sm font-medium group-hover:text-primary transition-colors">{data.next.title}</span>
        </Link>
      ) : <div className="flex-1" />}
    </nav>
  );
}
