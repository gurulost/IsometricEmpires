import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { GameView } from './components/game/GameView';
import { AudioProvider } from './components/AudioProvider';
import { NotFound } from './pages/not-found';

/**
 * Main App component that handles routing and global providers
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AudioProvider />
      <Router>
        <Routes>
          {/* Game Route - Main game view */}
          <Route path="/" element={<GameView />} />
          
          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}