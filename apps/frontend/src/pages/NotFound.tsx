import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFound() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto px-4 py-32 text-center">
      <p className="text-8xl font-bold text-muted-foreground/20">404</p>
      <h1 className="text-2xl font-bold mt-4">Page not found</h1>
      <p className="text-muted-foreground mt-2">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/"><Button className="mt-6 gap-2"><Home size={14} /> Back to home</Button></Link>
    </motion.div>
  );
}
