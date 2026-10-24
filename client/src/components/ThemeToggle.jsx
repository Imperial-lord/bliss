import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Laptop }
  ];

  const CurrentIcon =
    theme === 'system' ? Laptop : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (matches system automatically)`}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 dark:bg-[#141a1f] dark:hover:bg-[#1b2229] dark:text-[#9aa6af] dark:hover:text-white border border-slate-300/60 dark:border-white/10 transition-all duration-200 shadow-sm"
        aria-label="Toggle theme settings"
      >
        <CurrentIcon className="w-4 h-4 transition-transform duration-300 hover:rotate-12 text-[#ff7a00]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white dark:bg-[#12171c] border border-slate-200 dark:border-white/10 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150 font-sans">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-gray-500 border-b border-slate-100 dark:border-white/5 mb-1">
            Theme
          </div>
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setTheme(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'text-[#ff7a00] bg-orange-50/80 dark:bg-[#ff7a00]/10 font-bold'
                    : 'text-slate-700 dark:text-[#9aa6af] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-[#1b2229]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#ff7a00]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
