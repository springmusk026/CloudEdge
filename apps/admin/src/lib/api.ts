// Centralized API client for admin
const BASE = '/api/v1';

async function request<T>(path: string, opts?: RequestInit & { json?: unknown }): Promise<T> {
  const token = localStorage.getItem('cloudedge-token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts?.json) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { ...headers, ...(opts?.headers as Record<string, string>) },
    body: opts?.json ? JSON.stringify(opts.json) : opts?.body,
  });

  if (res.status === 401) {
    localStorage.removeItem('cloudedge-token');
    localStorage.removeItem('cloudedge-user');
    window.location.href = '/admin/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error || res.statusText);
  }
  return res.json();
}

export const api = {
  auth: {
    login: (data: { email: string; password: string }) => request<{ token: string; user: User }>('/auth/login', { method: 'POST', json: data }),
    me: () => request<User>('/auth/me'),
    logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  },
  posts: {
    list: (params?: { page?: number; limit?: number; status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.status) qs.set('status', params.status);
      return request<{ posts: Post[]; pagination: Pagination }>(`/posts?${qs}`);
    },
    get: (id: string) => request<Post & { tags: Tag[]; author: User }>(`/posts/${id}`).then(p => ({ ...p, visibility: p.visibility ?? 'public' })),
    create: (data: Partial<Post>) => request<{ id: string; slug: string }>('/posts', { method: 'POST', json: data }),
    update: (id: string, data: Partial<Post>) => request<{ ok: boolean }>(`/posts/${id}`, { method: 'PUT', json: data }),
    delete: (id: string) => request<{ ok: boolean }>(`/posts/${id}`, { method: 'DELETE' }),
    duplicate: (id: string) => request<{ id: string; slug: string }>(`/posts/${id}/duplicate`, { method: 'POST' }),
    share: (id: string) => request<{ url: string }>(`/posts/${id}/share`, { method: 'POST' }),
  },
  tags: {
    list: () => request<Tag[]>('/tags'),
    create: (data: { name: string }) => request<{ id: string }>('/tags', { method: 'POST', json: data }),
    delete: (id: string) => request<{ ok: boolean }>(`/tags/${id}`, { method: 'DELETE' }),
  },
  media: {
    list: (params?: { page?: number }) => request<MediaItem[]>(`/media?page=${params?.page || 1}`),
    getUploadUrl: (data: { filename: string; contentType: string; fileSize: number }) => request<{ id: string; r2Key: string; uploadUrl: string }>('/media/upload-url', { method: 'POST', json: data }),
    confirm: (data: { r2Key: string; filename: string; contentType: string; fileSize: number }) => request<{ id: string }>('/media/confirm', { method: 'POST', json: data }),
    delete: (id: string) => request<{ ok: boolean }>(`/media/${id}`, { method: 'DELETE' }),
  },
  comments: {
    list: () => request<Comment[]>('/comments?postId=all&admin=true'),
    moderate: (id: string, status: string) => request<{ ok: boolean }>(`/comments/${id}/moderate`, { method: 'PATCH', json: { status } }),
  },
  newsletter: {
    subscribers: (page?: number) => request<{ subscribers: Subscriber[]; total: number }>(`/newsletter/subscribers?page=${page || 1}`),
    campaigns: () => request<Campaign[]>('/newsletter/campaigns'),
    createCampaign: (data: { subject: string; contentHtml: string }) => request<{ id: string }>('/newsletter/campaigns', { method: 'POST', json: data }),
    send: (id: string) => request<{ ok: boolean; recipientCount: number }>(`/newsletter/campaigns/${id}/send`, { method: 'POST' }),
  },
  admin: {
    dashboard: () => request<DashboardData>('/admin/dashboard'),
    settings: () => request<Record<string, unknown>>('/admin/settings'),
    updateSettings: (data: Record<string, unknown>) => request<{ ok: boolean }>('/admin/settings', { method: 'PUT', json: data }),
    users: () => request<User[]>('/admin/users'),
    auditLog: (page?: number) => request<AuditEntry[]>(`/admin/audit-log?page=${page || 1}`),
    notifications: () => request<{ pendingComments: number; recentActions: number }>('/admin/notifications'),
    purgeCache: (keys?: string[]) => request<{ ok: boolean }>('/admin/cache/purge', { method: 'POST', json: { keys } }),
    customizer: () => request<any>('/admin/customizer'),
    updateCustomizer: (data: any) => request<{ ok: boolean }>('/admin/customizer', { method: 'PUT', json: data }),
    redirects: () => request<any[]>('/admin/redirects'),
    createRedirect: (data: { sourcePath: string; destinationUrl: string; statusCode: number }) => request<{ ok: boolean }>('/admin/redirects', { method: 'POST', json: data }),
  },
  ai: {
    improve: (text: string) => request<{ result: string }>('/ai/improve', { method: 'POST', json: { text } }),
    excerpt: (content: string) => request<{ excerpt: string }>('/ai/excerpt', { method: 'POST', json: { content } }),
    suggestTags: (title: string, content: string) => request<{ tags: string[] }>('/ai/suggest-tags', { method: 'POST', json: { title, content } }),
  },
};

// ─── Types ───
export interface User { id: string; email: string; name: string; role: string; bio?: string; avatarR2Key?: string; createdAt?: string; lastLogin?: string }
export interface Post { id: string; title: string; slug: string; contentHtml?: string; contentMarkdown?: string; excerpt?: string; status: string; authorId: string; featured: boolean; visibility: string; readingTimeMinutes?: number; wordCount?: number; publishedAt?: string; createdAt: string; updatedAt: string; tags?: string[]; metaTitle?: string; metaDescription?: string }
export interface Tag { id: string; name: string; slug: string; description?: string; postCount?: number }
export interface Comment { id: string; postId: string; guestName?: string; bodyHtml: string; status: string; createdAt: string }
export interface MediaItem { id: string; r2Key: string; originalFilename: string; mimeType: string; fileSizeBytes: number; width?: number; height?: number; altText?: string; createdAt: string }
export interface Subscriber { id: string; email: string; name?: string; confirmedAt?: string; cfGeoCountry?: string }
export interface Campaign { id: string; subject: string; status: string; recipientCount: number; openCount: number; sentAt?: string; createdAt: string }
export interface DashboardData { posts: number; subscribers: number; pendingComments: number; recentAnalytics: { date: string; totalViews: number; uniqueVisitors: number }[] }
export interface AuditEntry { id: string; userId?: string; action: string; resourceType?: string; resourceId?: string; createdAt: string }
export interface Pagination { page: number; limit: number; total: number }
