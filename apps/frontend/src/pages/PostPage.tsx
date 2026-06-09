import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, Tag, MessageCircle } from 'lucide-react';
import { usePost, useComments, useCreateComment } from '@/lib/queries';
import { ReadingProgress } from '@/components/ReadingProgress';
import { TableOfContents } from '@/components/TableOfContents';
import { RelatedPosts } from '@/components/RelatedPosts';
import { SEOHead } from '@/components/SEOHead';
import { BookmarkButton } from '@/components/BookmarkButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useMemo } from 'react';

export function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = usePost(slug!);
  const { data: comments = [] } = useComments(post?.id || '');

  // Add anchor IDs to headings for TOC linking
  const processedHtml = useMemo(() => {
    if (!post?.contentHtml) return '';
    return post.contentHtml.replace(/<h([23])>(.*?)<\/h[23]>/gi, (_, level, text) => {
      const id = text.replace(/<[^>]*>/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<h${level} id="${id}">${text}</h${level}>`;
    });
  }, [post?.contentHtml]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-96 mt-8 rounded-2xl" />
      </div>
    );
  }

  if (!post) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted-foreground">Post not found.</div>;

  return (
    <>
      <ReadingProgress />
      <SEOHead title={post.title} description={post.excerpt || undefined} author={post.author?.name} publishedAt={post.publishedAt || undefined} />

      {/* JSON-LD + OG Meta */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'Article',
        headline: post.title, datePublished: post.publishedAt,
        author: { '@type': 'Person', name: post.author?.name },
        description: post.excerpt,
      })}} />

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto px-4 py-12"
      >
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft size={14} /> Back to home
        </Link>

        {/* Header */}
        <header className="mb-10">
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map(tag => (
                <Link key={tag.slug} to={`/tag/${tag.slug}`}>
                  <Badge variant="secondary" className="gap-1"><Tag size={10} />{tag.name}</Badge>
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-bold leading-tight">{post.title}</h1>

          <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
            {post.author && <span className="font-medium text-foreground">{post.author.name}</span>}
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
            {post.readingTimeMinutes && (
              <span className="flex items-center gap-1">
                <Clock size={14} /> {post.readingTimeMinutes} min read
              </span>
            )}
            <BookmarkButton postId={post.id} title={post.title} slug={post.slug} />
          </div>
        </header>

        {/* Table of Contents */}
        <TableOfContents html={processedHtml} />

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: processedHtml }} />

        {/* Related Posts */}
        {post.tags && <RelatedPosts currentId={post.id} tags={post.tags} />}

        {/* Comments */}
        <section className="mt-16 pt-10 border-t">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <MessageCircle size={20} /> Comments ({comments.length})
          </h2>

          <div className="space-y-4 mb-8">
            {comments.map((comment, i) => (
              <motion.div key={comment.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{comment.guestName || 'Member'}</span>
                      <time className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</time>
                    </div>
                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: comment.bodyHtml }} />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <CommentForm postId={post.id} />
        </section>
      </motion.article>
    </>
  );
}

function CommentForm({ postId }: { postId: string }) {
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const mutation = useCreateComment();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    mutation.mutate({ postId, guestName: name, bodyHtml: `<p>${body}</p>` });
  }

  if (mutation.isSuccess) {
    return <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-green-600 font-medium">✓ Comment submitted for review!</motion.p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" />
      <textarea value={body} onChange={e => setBody(e.target.value)} required placeholder="Write a comment..."
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-24 resize-none" />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Posting...' : 'Post Comment'}
      </Button>
    </form>
  );
}
