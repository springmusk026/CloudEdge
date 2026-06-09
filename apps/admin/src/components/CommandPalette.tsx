import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Tag, Users, Settings, BarChart3, Plus, Image, MessageCircle } from 'lucide-react';

const COMMANDS = [
  { id: 'new-post', label: 'New Post', icon: Plus, action: '/posts/new' },
  { id: 'posts', label: 'All Posts', icon: FileText, action: '/posts' },
  { id: 'media', label: 'Media Library', icon: Image, action: '/media' },
  { id: 'comments', label: 'Comments', icon: MessageCircle, action: '/comments' },
  { id: 'tags', label: 'Tags', icon: Tag, action: '/tags' },
  { id: 'users', label: 'Users', icon: Users, action: '/users' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, action: '/analytics' },
  { id: 'settings', label: 'Settings', icon: Settings, action: '/settings' },
  { id: 'customizer', label: 'Customize', icon: Settings, action: '/customizer' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o); setQuery(''); setSelected(0); }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  function execute(cmd: typeof COMMANDS[0]) {
    navigate(cmd.action);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) { execute(filtered[selected]); }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()} className="relative w-full max-w-lg rounded-xl border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center border-b px-4">
              <Search size={16} className="text-muted-foreground" />
              <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelected(0); }} onKeyDown={handleKeyDown}
                placeholder="Type a command..." className="flex-1 px-3 py-3 bg-transparent outline-none text-sm" />
              <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">esc</kbd>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {filtered.map((cmd, i) => (
                <button key={cmd.id} onClick={() => execute(cmd)}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-left transition-colors ${i === selected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}>
                  <cmd.icon size={14} />
                  {cmd.label}
                </button>
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No results</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
