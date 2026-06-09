import { useState } from 'react';
import { Link2, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/${slug}`;

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
        {copied ? <Check size={14} className="text-green-500" /> : <Link2 size={14} />}
        {copied ? 'Copied' : 'Copy link'}
      </Button>
      <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">𝕏 Post</Button>
      </a>
      <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">in Share</Button>
      </a>
    </div>
  );
}
