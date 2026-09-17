import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import Home from './pages/Home.jsx';
import ForumDetail from './pages/ForumDetail.jsx';
import Upload from './pages/Upload.jsx';
import Moderate from './pages/Moderate.jsx';
import Guide from './pages/Guide.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';

export default function App() {
  return (
    <>
      <Nav />
      <main className="container">
        <AppErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/forum/:slug" element={<ForumDetail />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/moderate" element={<Moderate />} />
            <Route path="/guide" element={<Guide />} />
          </Routes>
        </AppErrorBoundary>
      </main>
    </>
  );
}
