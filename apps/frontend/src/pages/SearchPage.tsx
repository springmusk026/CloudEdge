import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { useSearch } from '../lib/queries';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const { data, isLoading } = useSearch(submitted);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(query.trim());
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-10">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" disabled={isLoading || query.length < 3}
          className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Search
        </button>
      </form>

      <AnimatePresence mode="wait">
        {data?.results && data.results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {data.results.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/${r.id}`} className="block p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 hover:shadow-md transition-all">
                  <h3 className="font-medium">{r.title || r.id}</h3>
                  <div className="mt-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${r.score * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 mt-1">{(r.score * 100).toFixed(0)}% match</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
        {submitted && !isLoading && data?.results?.length === 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-gray-500">
            No results found for "{submitted}".
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
