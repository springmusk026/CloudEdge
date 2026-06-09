import { useEffect } from 'react';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  type?: string;
  url?: string;
  author?: string;
  publishedAt?: string;
}

export function SEOHead({ title, description, ogImage, type = 'article', url, author, publishedAt }: Props) {
  useEffect(() => {
    document.title = `${title} — CloudEdge`;

    const setMeta = (property: string, content: string | undefined) => {
      if (!content) return;
      let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(property.startsWith('og:') || property.startsWith('article:') ? 'property' : 'name', property); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:type', type);
    setMeta('og:image', ogImage);
    setMeta('og:url', url || window.location.href);
    setMeta('twitter:card', ogImage ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', ogImage);
    setMeta('article:author', author);
    setMeta('article:published_time', publishedAt);

    return () => { document.title = 'CloudEdge Blog'; };
  }, [title, description, ogImage, type, url, author, publishedAt]);

  return null;
}
