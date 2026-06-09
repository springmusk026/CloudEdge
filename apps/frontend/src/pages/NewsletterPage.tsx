import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { NewsletterCTA } from '../components/NewsletterCTA';

export function NewsletterPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-6">
        <Mail size={28} className="text-blue-600" />
      </div>
      <h1 className="text-4xl font-bold">Newsletter</h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        A weekly digest of the best content on edge computing, web performance, and serverless architecture.
      </p>
      <div className="mt-8">
        <NewsletterCTA source="newsletter-page" />
      </div>
      <p className="mt-4 text-xs text-gray-500">No spam. Unsubscribe anytime.</p>
    </motion.div>
  );
}
