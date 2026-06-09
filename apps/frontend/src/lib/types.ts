// Centralized API types for the frontend
export interface Post {
  id: string;
  title: string;
  slug: string;
  contentHtml: string | null;
  contentMarkdown: string | null;
  excerpt: string | null;
  status: string;
  authorId: string;
  primaryImageR2Key: string | null;
  readingTimeMinutes: number | null;
  wordCount: number | null;
  featured: boolean;
  visibility: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  author?: Author;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount?: number;
}

export interface Author {
  id: string;
  name: string;
  bio: string | null;
  avatarR2Key: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: string | null;
  guestName: string | null;
  bodyHtml: string;
  upvotes: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  posts: T[];
  pagination: { page: number; limit: number; total: number };
}

export interface SearchResult {
  id: string;
  score: number;
  title?: string;
}
