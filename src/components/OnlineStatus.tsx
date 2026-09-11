import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export function OnlineStatus() {
  const { t } = useLanguage();
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        online
          ? 'bg-success-100 text-success-700'
          : 'bg-warning-100 text-warning-700'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${online ? 'bg-success-500' : 'bg-warning-500'}`} />
      {online ? t('onlineSynced') : t('offlineMode')}
    </span>
  );
}
