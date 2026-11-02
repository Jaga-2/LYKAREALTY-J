import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'nav' | 'compact' | 'footer';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'nav' }) => {
  const { language, setLanguage } = useLanguage();

  if (variant === 'footer') {
    return (
      <div className="flex flex-wrap items-center gap-2 max-w-full">
        <span className="text-xs text-[#75777a] flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5 text-[#c5a880]" />
          <span>Language:</span>
        </span>
        <div className="inline-flex items-center rounded-[3px] border border-[#c5a880]/30 bg-white/5 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 rounded-[2px] transition-all cursor-pointer font-medium ${
              language === 'en'
                ? 'bg-[#c5a880] text-[#121517] font-semibold'
                : 'text-[#dadad8] hover:text-white'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ar')}
            className={`px-2.5 py-1 rounded-[2px] transition-all cursor-pointer font-medium font-sans ${
              language === 'ar'
                ? 'bg-[#c5a880] text-[#121517] font-semibold'
                : 'text-[#dadad8] hover:text-white'
            }`}
          >
            العربية
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ta')}
            className={`px-2.5 py-1 rounded-[2px] transition-all cursor-pointer font-medium ${
              language === 'ta'
                ? 'bg-[#c5a880] text-[#121517] font-semibold'
                : 'text-[#dadad8] hover:text-white'
            }`}
          >
            தமிழ்
          </button>
          <button
            type="button"
            onClick={() => setLanguage('tanglish')}
            className={`px-2.5 py-1 rounded-[2px] transition-all cursor-pointer font-medium ${
              language === 'tanglish'
                ? 'bg-[#c5a880] text-[#121517] font-semibold'
                : 'text-[#dadad8] hover:text-white'
            }`}
          >
            Tanglish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center rounded-[3px] border border-[#c5a880]/35 bg-white shadow-sm p-[2px] transition-all"
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-1.5 py-1 text-xs rounded-[2px] transition-all cursor-pointer flex items-center gap-1 leading-none ${
          language === 'en'
            ? 'bg-[#1f2428] text-[#c5a880] font-semibold shadow-xs'
            : 'text-[#75777a] hover:text-[#1f2428]'
        }`}
        title="Switch to English"
        aria-pressed={language === 'en'}
      >
        <span className="tracking-wide">EN</span>
      </button>

      <span className="w-[1px] h-3 bg-[#c5a880]/25 mx-0.5" />

      <button
        type="button"
        onClick={() => setLanguage('ar')}
        className={`px-1.5 py-1 text-xs rounded-[2px] transition-all cursor-pointer flex items-center gap-1 leading-none font-sans ${
          language === 'ar'
            ? 'bg-[#1f2428] text-[#c5a880] font-semibold shadow-xs'
            : 'text-[#75777a] hover:text-[#1f2428]'
        }`}
        title="التبديل إلى العربية"
        aria-pressed={language === 'ar'}
      >
        <span className="text-[11px] font-medium">عربي</span>
      </button>

      <span className="w-[1px] h-3 bg-[#c5a880]/25 mx-0.5" />

      <button
        type="button"
        onClick={() => setLanguage('ta')}
        className={`px-1.5 py-1 text-xs rounded-[2px] transition-all cursor-pointer flex items-center gap-1 leading-none ${
          language === 'ta'
            ? 'bg-[#1f2428] text-[#c5a880] font-semibold shadow-xs'
            : 'text-[#75777a] hover:text-[#1f2428]'
        }`}
        title="தமிழுக்கு மாறவும்"
        aria-pressed={language === 'ta'}
      >
        <span className="text-[11px] font-medium">தமிழ்</span>
      </button>

      <span className="w-[1px] h-3 bg-[#c5a880]/25 mx-0.5" />

      <button
        type="button"
        onClick={() => setLanguage('tanglish')}
        className={`px-1.5 py-1 text-xs rounded-[2px] transition-all cursor-pointer flex items-center gap-1 leading-none ${
          language === 'tanglish'
            ? 'bg-[#1f2428] text-[#c5a880] font-semibold shadow-xs'
            : 'text-[#75777a] hover:text-[#1f2428]'
        }`}
        title="Switch to Tanglish"
        aria-pressed={language === 'tanglish'}
      >
        <span className="text-[11px] font-medium">Tanglish</span>
      </button>
    </div>
  );
};
