'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage, LANGUAGE_OPTIONS, Language } from '@/context/LanguageContext';

export function LanguageSelector() {
  const { language, setLanguage, currentOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left z-30" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#131b2e] hover:bg-[#1b263f] border border-[#1e2d4a] text-slate-200 hover:text-white transition-all shadow-sm group"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Select Application Language (English / Hindi / Hinglish)"
      >
        <Globe className="w-3.5 h-3.5 text-blue-400 group-hover:rotate-45 transition-transform duration-300" />
        <span className="flex items-center gap-1.5">
          <span>{currentOption.flag}</span>
          <span className="font-mono">{currentOption.badge}</span>
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0c1220]/95 border border-[#1e2d4a] shadow-2xl shadow-blue-950/40 backdrop-blur-xl p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-[#1e2d4a]/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Language / भाषा</p>
            <p className="text-[11px] text-slate-300">Select Console Preference</p>
          </div>

          <div className="py-1 space-y-0.5">
            {LANGUAGE_OPTIONS.map((opt) => {
              const isSelected = language === opt.code;
              return (
                <button
                  key={opt.code}
                  onClick={() => {
                    setLanguage(opt.code as Language);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{opt.flag}</span>
                    <div className="text-left">
                      <p className="font-semibold leading-none text-slate-100">{opt.label}</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{opt.nativeLabel}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-400 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-2 bg-[#090d16]/80 rounded-xl border border-[#1e2d4a]/40 text-[10px] text-slate-400 text-center font-mono">
            EN · HI (हिंदी) · Hinglish
          </div>
        </div>
      )}
    </div>
  );
}
