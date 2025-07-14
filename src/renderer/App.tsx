import { useEffect, useMemo, useState } from 'react';
import MainPage from './pages/MainPage';
import BreakOverlay from './pages/BreakOverlay';
import SettingsPage from './pages/SettingsPage';
import { ThemeProvider } from './components/theme-provider';

declare global {
  interface Window {
    theme: {
      isDark: () => boolean;
      onUpdated: (callback: () => void) => void;
    };
  }
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [theme, setTheme] = useState<null | 'dark' | 'light'>(null);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (window.theme) {
      const updateTheme = async () => {
        const isDark = await window.theme.isDark();
        setTheme(isDark ? 'dark' : 'light');
      };
      updateTheme();
    }
  }, []);

  
  const currentPage = useMemo(() => {
    if (hash === "#settings") return <SettingsPage />
    if (hash === "#break") return <BreakOverlay />
    return <MainPage />;
  }, [hash])
  
  if (theme === null) return null;

  return <ThemeProvider defaultTheme={theme}>
    <main className='dark:bg-zinc-700 h-screen'>
      {currentPage}
    </main>
  </ThemeProvider>
} 