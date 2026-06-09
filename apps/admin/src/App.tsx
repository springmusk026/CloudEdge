import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { PostsList } from '@/pages/PostsList';
import { PostEditor } from '@/pages/PostEditor';
import { MediaLibrary } from '@/pages/MediaLibrary';
import { Comments } from '@/pages/Comments';
import { Newsletter } from '@/pages/Newsletter';
import { Settings } from '@/pages/Settings';
import { Users } from '@/pages/Users';
import { Tags } from '@/pages/Tags';
import { Analytics } from '@/pages/Analytics';
import { Customizer } from '@/pages/Customizer';
import { CommandPalette } from '@/components/CommandPalette';

function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuth(s => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <CommandPalette />
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="posts" element={<PostsList />} />
        <Route path="posts/new" element={<PostEditor />} />
        <Route path="posts/:id/edit" element={<PostEditor />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="comments" element={<Comments />} />
        <Route path="newsletter" element={<Newsletter />} />
        <Route path="tags" element={<Tags />} />
        <Route path="users" element={<Users />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="customizer" element={<Customizer />} />
      </Route>
      </Routes>
    </>
  );
}
