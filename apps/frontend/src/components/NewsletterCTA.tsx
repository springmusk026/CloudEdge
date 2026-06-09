import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { useSubscribe } from '../lib/queries';

interface Props {
  source?: string;
  compact?: boolean;
}

export function NewsletterCTA({ source = 'inline', compact = false }: Props) {
  const [email, setEmail] = useState('');
  const subscribe = useSubscribe();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    subscribe.mutate({ email, source });
  }

  if (subscribe.isSuccess) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
        <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
        <p className="text-sm font-medium text-green-700 dark:text-green-400">Check your inbox to confirm!</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${compact ? '' : 'max-w-md mx-auto'}`}>
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={subscribe.isPending}
        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
      >
        {subscribe.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Subscribe
      </button>
    </form>
  );
}
