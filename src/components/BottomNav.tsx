import { useLanguage } from '@/lib/LanguageContext';
import { Bell, Gamepad2, Heart } from 'lucide-react';
import type { Screen } from '@/types';

interface BottomNavProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
}

const NAV_ICONS: { key: Screen; labelKey: string; icon: typeof Bell }[] = [
  { key: 'reminders', labelKey: 'reminders', icon: Bell },
  { key: 'games', labelKey: 'games', icon: Gamepad2 },
  { key: 'caregiver', labelKey: 'caregiver', icon: Heart },
];

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary-700 shadow-[0_-4px_20px_rgba(60,70,30,0.15)] safe-bottom">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {NAV_ICONS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-primary-200 hover:text-primary-100'
              }`}
              aria-label={t(item.labelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-secondary-400 text-primary-900 shadow-md scale-105'
                    : 'bg-transparent'
                }`}
              >
                <Icon size={28} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
