import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePosts, useTag } from '../lib/queries';
import { PostCard } from '../components/PostCard';

export function TagPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: tag } = useTag(slug!);
  const { data, isLoading } = usePosts({ tag: slug });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">{tag?.name || slug}</h1>
        {tag?.description && <p className="mt-2 text-gray-600 dark:text-gray-400">{tag.description}</p>}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)
          : data?.posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
        }
      </div>
    </div>
  );
}
