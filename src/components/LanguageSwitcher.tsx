'use client';

import { useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '../i18n/navigation';
import { ChevronDown } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const switchLanguage = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    startTransition(() => {
      // 使用 next-intl 的路由器进行语言切换
      router.replace(pathname, { locale: newLocale });
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className={`
          inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all duration-200
          ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <ChevronDown
          className={`h-5 w-5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {languages.map((language) => (
              <button
                key={language.code}
                className={`
                  flex w-full items-center px-4 py-2 text-sm transition-colors duration-200
                  ${
                    language.code === locale
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
                onClick={() => switchLanguage(language.code)}
                disabled={isPending}
              >
                <span className="mr-3 text-lg">{language.flag}</span>
                <span>{language.name}</span>
                {language.code === locale && (
                  <span className="ml-auto text-indigo-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 