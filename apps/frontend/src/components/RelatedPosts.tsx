import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Post } from '@/lib/types';

export function RelatedPosts({ currentId, tags }: { currentId: string; tags: { slug: string }[] }) {
  const tagSlug = tags[0]?.slug;
  const { data } = useQuery({
    queryKey: ['related', currentId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/posts?tag=${tagSlug}&limit=4`);
      const data = await res.json();
      return (data.posts as Post[]).filter(p => p.id !== currentId).slice(0, 3);
    },
    enabled: !!tagSlug,
  });

  if (!data?.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="mt-16 pt-10 border-t"
    >
      <h2 className="text-xl font-bold mb-6">Related Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map(post => (
          <Link key={post.id} to={`/${post.slug}`} className="group p-4 rounded-xl border hover:border-primary/50 hover:shadow-sm transition-all">
            <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{post.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
            <span className="inline-flex items-center gap-1 text-xs text-primary mt-2">Read <ArrowRight size={10} /></span>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
