import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Search, Menu, X, Rss } from 'lucide-react';

export function Header() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('cloudedge-theme');
    if (stored) return stored === 'dark';
    return document.documentElement.classList.contains('dark');
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  function toggleDark() {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('cloudedge-theme', next ? 'dark' : 'light');
    setDark(next);
  }

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/archive', label: 'Archive' },
    { to: '/newsletter', label: 'Newsletter' },
    { to: '/search', label: 'Search' },
    { to: '/reading-list', label: 'Reading List' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">
          CloudEdge
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`transition-colors hover:text-blue-600 ${location.pathname === item.to ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {item.label}
            </Link>
          ))}
          <a href="/rss.xml" className="text-gray-400 hover:text-orange-500 transition-colors" aria-label="RSS Feed">
            <Rss size={18} />
          </a>
          <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Toggle theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>

        {/* Mobile menu toggle */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2" aria-label="Menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              {navItems.map(item => (
                <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600">
                  {item.label}
                </Link>
              ))}
              <button onClick={toggleDark} className="text-sm text-gray-500">
                {dark ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
