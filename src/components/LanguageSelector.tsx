import { useState, useRef, useEffect } from 'react';
import { Check, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { LANGUAGE_LABELS } from '@/lib/translations';
import type { Language } from '@/types';

export function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LANGUAGE_LABELS.find((l) => l.code === lang)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-card transition-all hover:shadow-card-lg active:scale-95"
        aria-label="Select Language"
        aria-expanded={open}
      >
        <Globe size={22} className="text-primary-700" strokeWidth={2.5} />
        <span className="text-base font-semibold text-primary-800">{current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl bg-white shadow-card-lg animate-fade-in">
          {LANGUAGE_LABELS.map((option) => (
            <button
              key={option.code}
              onClick={() => {
                setLang(option.code as Language);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-cream-100 ${
                lang === option.code ? 'bg-primary-50' : ''
              }`}
            >
              <span className="flex items-center gap-2 text-base font-semibold text-primary-800">
                <span className="text-lg">{option.flag}</span>
                {option.label}
              </span>
              {lang === option.code && (
                <Check size={20} className="text-primary-600" strokeWidth={2.5} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
