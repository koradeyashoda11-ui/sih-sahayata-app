import { useState } from 'react';
import { LanguageProvider } from '@/lib/LanguageContext';
import { BottomNav } from '@/components/BottomNav';
import { TopHeader } from '@/components/TopHeader';
import { RemindersScreen } from '@/screens/RemindersScreen';
import { GamesScreen } from '@/screens/GamesScreen';
import { CaregiverScreen } from '@/screens/CaregiverScreen';
import type { Screen } from '@/types';

function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('reminders');
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const handleNavigate = (screen: Screen) => {
    setActiveScreen(screen);
    setActiveGame(null);
  };

  return (
    <LanguageProvider>
      <div className="mx-auto min-h-screen max-w-md bg-cream-100">
        <TopHeader />
        <main className="pb-24">
          {activeScreen === 'reminders' && <RemindersScreen />}
          {activeScreen === 'games' && (
            <GamesScreen playingGame={activeGame} onStartGame={setActiveGame} />
          )}
          {activeScreen === 'caregiver' && <CaregiverScreen />}
        </main>
        <BottomNav active={activeScreen} onNavigate={handleNavigate} />
      </div>
    </LanguageProvider>
  );
}

export default App;
