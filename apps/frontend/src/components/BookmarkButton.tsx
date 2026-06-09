import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Bookmark a post to localStorage reading list
export function BookmarkButton({ postId, title, slug }: { postId: string; title: string; slug: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const list = getReadingList();
    setSaved(list.some(item => item.id === postId));
  }, [postId]);

  function toggle() {
    const list = getReadingList();
    if (saved) {
      localStorage.setItem('cloudedge-reading-list', JSON.stringify(list.filter(i => i.id !== postId)));
    } else {
      list.push({ id: postId, title, slug, savedAt: new Date().toISOString() });
      localStorage.setItem('cloudedge-reading-list', JSON.stringify(list));
    }
    setSaved(!saved);
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="gap-1.5" title={saved ? 'Remove from reading list' : 'Save to reading list'}>
      {saved ? <BookmarkCheck size={16} className="text-primary" /> : <Bookmark size={16} />}
      {saved ? 'Saved' : 'Save'}
    </Button>
  );
}

export function getReadingList(): { id: string; title: string; slug: string; savedAt: string }[] {
  try { return JSON.parse(localStorage.getItem('cloudedge-reading-list') || '[]'); } catch { return []; }
}
