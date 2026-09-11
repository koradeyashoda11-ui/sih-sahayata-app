import { Brain, Gamepad2, Lock, Sparkles, Volume2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { MemoryMatch as MemoryMatchGame } from './MemoryMatchGame';

interface GamesScreenProps {
  playingGame: string | null;
  onStartGame: (game: string | null) => void;
}

export function GamesScreen({ playingGame, onStartGame }: GamesScreenProps) {
  const { t, speak, stopSpeaking } = useLanguage();

  if (playingGame === 'memory_match') {
    return <MemoryMatchGame onBack={() => onStartGame(null)} />;
  }

  const handleListenGame = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(`${t('memoryMatch')}. ${t('memoryMatchDesc')}`);
  };

  return (
    <div className="animate-fade-in px-5 pb-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4 pt-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-500 shadow-card">
          <Gamepad2 size={32} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-semibold text-primary-900">{t('brainGames')}</h1>
          <p className="text-lg text-primary-700">{t('keepMindSharp')}</p>
        </div>
      </div>

      {/* Available games */}
      <h2 className="mb-3 text-xl font-bold text-primary-800">{t('availableGames')}</h2>

      <div className="flex flex-col gap-4">
        {/* Memory Match - featured */}
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 shadow-card-lg">
          {/* Decorative emojis */}
          <div className="pointer-events-none absolute right-2 top-2 text-6xl opacity-10">
            🎋
          </div>
          <div className="pointer-events-none absolute bottom-2 right-16 text-5xl opacity-10">
            🦏
          </div>

          <div className="relative z-10">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-400 shadow-md">
              <Brain size={30} className="text-primary-900" strokeWidth={2.5} />
            </div>
            <h3 className="font-heading text-2xl font-semibold text-white">{t('memoryMatch')}</h3>
            <p className="mt-1 text-lg text-primary-200">{t('memoryMatchDesc')}</p>

            {/* Theme preview chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {['🦏 Rhino', '🌿 Tea Leaves', '🎋 Bamboo', '🏔️ Mountains', '🐅 Tiger', '🧶 Textiles'].map((theme) => (
                <span
                  key={theme}
                  className="rounded-full bg-primary-800/60 px-3 py-1.5 text-sm font-semibold text-secondary-200"
                >
                  {theme}
                </span>
              ))}
            </div>

            {/* Buttons row */}
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => onStartGame('memory_match')}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary-400 px-5 py-3 transition-all hover:bg-secondary-300 active:scale-95"
              >
                <Sparkles size={22} className="text-primary-900" strokeWidth={2.5} />
                <span className="text-lg font-bold text-primary-900">{t('startPlaying')}</span>
              </button>
              <button
                onClick={handleListenGame}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white transition-all hover:bg-white/30 active:scale-90"
                aria-label={t('listen')}
                title={t('listen')}
              >
                <Volume2 size={22} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Placeholder for future games */}
        <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-primary-200 bg-cream-50 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100">
            <Lock size={26} className="text-primary-400" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary-500">{t('moreGamesSoon')}</h3>
            <p className="text-base text-primary-400">{t('moreGamesSub')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
