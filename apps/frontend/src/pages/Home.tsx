import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { usePosts } from '../lib/queries';
import { PostCard } from '../components/PostCard';
import { NewsletterCTA } from '../components/NewsletterCTA';

export function Home() {
  const { data, isLoading } = usePosts({ limit: 10 });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const posts = data?.posts || [];
  const featured = posts.find(p => p.featured);
  const recent = posts.filter(p => p !== featured);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-20">
      {/* Hero — Featured Post */}
      {featured && (
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Link to={`/${featured.slug}`} className="group block">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-850 dark:to-gray-800 p-8 md:p-14 transition-shadow hover:shadow-xl">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 mb-4">
                <Sparkles size={16} />
                <span>Featured</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight group-hover:text-blue-600 transition-colors">
                {featured.title}
              </h1>
              {featured.excerpt && (
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">{featured.excerpt}</p>
              )}
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600">
                Read more <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </motion.section>
      )}

      {/* Recent Posts */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Recent Posts</h2>
          <Link to="/archive" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recent.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 md:p-12 text-center"
      >
        <h2 className="text-2xl font-bold">Stay in the loop</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Get the latest posts delivered to your inbox weekly.</p>
        <div className="mt-6">
          <NewsletterCTA source="homepage" />
        </div>
        <p className="mt-3 text-xs text-gray-500">No spam. Unsubscribe anytime.</p>
      </motion.section>
    </div>
  );
}
