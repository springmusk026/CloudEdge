import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { usePosts } from '../lib/queries';

export function ArchivePage() {
  const { data, isLoading } = usePosts({ limit: 100 });

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse">Loading...</div>;

  const posts = data?.posts || [];
  const grouped = posts.reduce<Record<string, typeof posts>>((acc, post) => {
    if (!post.publishedAt) return acc;
    const key = post.publishedAt.slice(0, 7); // YYYY-MM
    (acc[key] ||= []).push(post);
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-10">Archive</h1>
      {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([month, posts]) => (
        <section key={month} className="mb-10">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Calendar size={14} />
            {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </h2>
          <div className="space-y-3">
            {posts.map(post => (
              <Link to={`/${post.slug}`} key={post.id}
                className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group">
                <span className="font-medium group-hover:text-blue-600 transition-colors">{post.title}</span>
                <time className="text-xs text-gray-400 shrink-0 ml-4">{new Date(post.publishedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </motion.div>
  );
}
