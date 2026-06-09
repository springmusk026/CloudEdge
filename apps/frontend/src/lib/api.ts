// Centralized API client
import type { Post, Tag, Comment, PaginatedResponse, SearchResult, Author } from './types';

const BASE_URL = '/api/v1';

async function fetchApi<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const api = {
  posts: {
    list: (params?: { page?: number; limit?: number; featured?: boolean; tag?: string }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.featured) qs.set('featured', 'true');
      if (params?.tag) qs.set('tag', params.tag);
      return fetchApi<PaginatedResponse<Post>>(`/posts?${qs}`);
    },
    getBySlug: (slug: string) => fetchApi<Post & { tags: Tag[]; author: Author }>(`/posts/${slug}`),
  },
  tags: {
    list: () => fetchApi<Tag[]>('/tags'),
    getBySlug: (slug: string) => fetchApi<Tag>(`/tags/${slug}`),
  },
  comments: {
    listByPost: (postId: string) => fetchApi<Comment[]>(`/comments?postId=${postId}`),
    create: (data: { postId: string; bodyHtml: string; guestName?: string; guestEmail?: string }) =>
      fetchApi<{ id: string; status: string }>('/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },
  newsletter: {
    subscribe: (data: { email: string; name?: string; source?: string }) =>
      fetchApi<{ ok: boolean; message: string }>('/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },
  search: (query: string) =>
    fetchApi<{ results: SearchResult[] }>('/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    }),
};
