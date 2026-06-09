import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props { postId: string }

export function SeriesNav({ postId }: Props) {
  const { data } = useQuery({
    queryKey: ['series-nav', postId],
    queryFn: async () => {
      // Fetch series info for this post from the API
      const res = await fetch(`/api/v1/posts/${postId}`);
      const post = await res.json();
      // For now use tag-based navigation as series API isn't exposed yet
      return null;
    },
    enabled: false, // Enable when series API is ready
  });

  if (!data) return null;
  return null; // Placeholder for future series nav
}
