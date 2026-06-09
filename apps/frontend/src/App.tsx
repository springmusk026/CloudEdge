import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { PostPage } from './pages/PostPage';
import { TagPage } from './pages/TagPage';
import { ArchivePage } from './pages/ArchivePage';
import { SearchPage } from './pages/SearchPage';
import { NewsletterPage } from './pages/NewsletterPage';
import { AuthorPage } from './pages/AuthorPage';
import { ReadingListPage } from './pages/ReadingListPage';
import { AnnouncementBanner } from './components/AnnouncementBanner';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <AnnouncementBanner />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:slug" element={<PostPage />} />
          <Route path="/tag/:slug" element={<TagPage />} />
          <Route path="/author/:slug" element={<AuthorPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/newsletter" element={<NewsletterPage />} />
          <Route path="/reading-list" element={<ReadingListPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
