// TanStack Query hooks for the frontend
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from './api';

export const queryKeys = {
  posts: ['posts'] as const,
  postList: (params?: Record<string, unknown>) => ['posts', 'list', params] as const,
  postBySlug: (slug: string) => ['posts', slug] as const,
  tags: ['tags'] as const,
  tagBySlug: (slug: string) => ['tags', slug] as const,
  comments: (postId: string) => ['comments', postId] as const,
  search: (query: string) => ['search', query] as const,
};

export function usePosts(params?: { page?: number; limit?: number; featured?: boolean; tag?: string }) {
  return useQuery({
    queryKey: queryKeys.postList(params),
    queryFn: () => api.posts.list(params),
  });
}

export function usePost(slug: string) {
  return useQuery({
    queryKey: queryKeys.postBySlug(slug),
    queryFn: () => api.posts.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => api.tags.list(),
  });
}

export function useTag(slug: string) {
  return useQuery({
    queryKey: queryKeys.tagBySlug(slug),
    queryFn: () => api.tags.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: queryKeys.comments(postId),
    queryFn: () => api.comments.listByPost(postId),
    enabled: !!postId,
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => api.search(query),
    enabled: query.length > 2,
  });
}

export function useSubscribe() {
  return useMutation({
    mutationFn: (data: { email: string; name?: string; source?: string }) =>
      api.newsletter.subscribe(data),
  });
}

export function useCreateComment() {
  return useMutation({
    mutationFn: (data: { postId: string; bodyHtml: string; guestName?: string; guestEmail?: string }) =>
      api.comments.create(data),
  });
}
