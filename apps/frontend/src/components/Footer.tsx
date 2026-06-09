import { Rss, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-20">
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} CloudEdge Blog. Powered by Cloudflare.</p>
        <div className="flex items-center gap-4">
          <a href="/rss.xml" className="hover:text-orange-500 transition-colors flex items-center gap-1" aria-label="RSS">
            <Rss size={14} /> RSS
          </a>
          <a href="/feed.json" className="hover:text-blue-500 transition-colors flex items-center gap-1">
            <ExternalLink size={14} /> JSON Feed
          </a>
        </div>
      </div>
    </footer>
  );
}
