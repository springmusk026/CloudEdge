// Centralized TanStack Query hooks for admin
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export const keys = {
  dashboard: ['dashboard'] as const,
  posts: (params?: Record<string, unknown>) => ['posts', params] as const,
  post: (id: string) => ['posts', id] as const,
  tags: ['tags'] as const,
  media: (page?: number) => ['media', page] as const,
  comments: ['comments'] as const,
  subscribers: (page?: number) => ['subscribers', page] as const,
  campaigns: ['campaigns'] as const,
  users: ['users'] as const,
  settings: ['settings'] as const,
};

export const useDashboard = () => useQuery({ queryKey: keys.dashboard, queryFn: api.admin.dashboard });
export const usePosts = (params?: { page?: number; limit?: number; status?: string }) => useQuery({ queryKey: keys.posts(params), queryFn: () => api.posts.list(params) });
export const usePost = (id: string) => useQuery({ queryKey: keys.post(id), queryFn: () => api.posts.get(id), enabled: !!id });
export const useTags = () => useQuery({ queryKey: keys.tags, queryFn: api.tags.list });
export const useMedia = (page?: number) => useQuery({ queryKey: keys.media(page), queryFn: () => api.media.list({ page }) });
export const useComments = () => useQuery({ queryKey: keys.comments, queryFn: api.comments.list });
export const useSubscribers = (page?: number) => useQuery({ queryKey: keys.subscribers(page), queryFn: () => api.newsletter.subscribers(page) });
export const useCampaigns = () => useQuery({ queryKey: keys.campaigns, queryFn: api.newsletter.campaigns });
export const useUsers = () => useQuery({ queryKey: keys.users, queryFn: api.admin.users });
export const useSettings = () => useQuery({ queryKey: keys.settings, queryFn: api.admin.settings });

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.posts.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }) });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (name: string) => api.tags.create({ name }), onSuccess: () => qc.invalidateQueries({ queryKey: keys.tags }) });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.tags.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: keys.tags }) });
}

export function useModerateComment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => api.comments.moderate(id, status), onSuccess: () => qc.invalidateQueries({ queryKey: keys.comments }) });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, unknown>) => api.admin.updateSettings(data), onSuccess: () => qc.invalidateQueries({ queryKey: keys.settings }) });
}
