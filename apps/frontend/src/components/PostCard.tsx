import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Calendar } from 'lucide-react';
import type { Post } from '../lib/types';
import { timeAgo } from '../lib/time';

interface PostCardProps {
  post: Post;
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/${post.slug}`} className="group block h-full">
        <div className="h-full bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all duration-200">
          {post.featured && (
            <span className="inline-block text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full mb-3">
              Featured
            </span>
          )}
          <h3 className="font-semibold text-lg leading-snug group-hover:text-blue-600 transition-colors">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{post.excerpt}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {timeAgo(post.publishedAt)}
              </span>
            )}
            {post.readingTimeMinutes && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {post.readingTimeMinutes} min
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
