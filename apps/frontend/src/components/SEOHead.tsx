import { useEffect } from 'react';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  type?: string;
  url?: string;
  author?: string;
  publishedAt?: string;
  breadcrumbs?: { name: string; url: string }[];
}

export function SEOHead({ title, description, ogImage, type = 'article', url, author, publishedAt, breadcrumbs }: Props) {
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

    // JSON-LD Breadcrumbs
    if (breadcrumbs?.length) {
      let script = document.getElementById('breadcrumb-ld') as HTMLScriptElement;
      if (!script) { script = document.createElement('script'); script.id = 'breadcrumb-ld'; script.type = 'application/ld+json'; document.head.appendChild(script); }
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: b.url })),
      });
    }

    return () => { document.title = 'CloudEdge Blog'; };
  }, [title, description, ogImage, type, url, author, publishedAt, breadcrumbs]);

  return null;
}
