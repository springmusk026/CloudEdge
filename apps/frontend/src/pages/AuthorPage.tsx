import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PostCard } from '@/components/PostCard';
import type { Post, Author } from '@/lib/types';

export function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['author', slug],
    queryFn: async () => {
      // Fetch posts and find author info from them
      const res = await fetch(`/api/v1/posts?limit=50`);
      const { posts } = await res.json() as { posts: (Post & { author?: Author; authorId: string })[] };
      // Find author by matching slug to name-slug pattern
      const authorPosts = posts.filter(p => {
        const authorSlug = p.author?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';
        return authorSlug === slug || p.authorId === slug;
      });
      const author = authorPosts[0]?.author;
      return { author, posts: authorPosts };
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">Loading...</div>;
  if (!data?.author) return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-muted-foreground">Author not found.</div>;

  const { author, posts } = data;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto px-4 py-12">
      {/* Author Header */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg font-bold">{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{author.name}</h1>
          {author.bio && <p className="text-muted-foreground mt-1">{author.bio}</p>}
        </div>
      </div>

      <Separator className="mb-8" />

      <h2 className="text-lg font-semibold mb-4">Posts by {author.name} ({posts.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
      </div>
    </motion.div>
  );
}
