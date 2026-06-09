import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getReadingList } from '@/components/BookmarkButton';

export function ReadingListPage() {
  const [items, setItems] = useState(getReadingList());

  function remove(id: string) {
    const updated = items.filter(i => i.id !== id);
    localStorage.setItem('cloudedge-reading-list', JSON.stringify(updated));
    setItems(updated);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-8"><Bookmark size={24} /> Reading List</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No saved posts yet. Click the bookmark icon on any post to save it here.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl border hover:border-primary/30 transition-colors">
              <Link to={`/${item.slug}`} className="font-medium hover:text-primary flex-1">{item.title}</Link>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{new Date(item.savedAt).toLocaleDateString()}</span>
                <Button variant="ghost" size="icon" onClick={() => remove(item.id)}><Trash2 size={14} className="text-destructive" /></Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
