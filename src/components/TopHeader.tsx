import { useLanguage } from '@/lib/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { OnlineStatus } from '@/components/OnlineStatus';

export function TopHeader() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-sm border-b border-primary-100">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-xl font-semibold text-primary-800">{t('appName')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <OnlineStatus />
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}
