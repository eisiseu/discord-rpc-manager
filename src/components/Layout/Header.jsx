import React from 'react';
import { HiMinus, HiOutlineStop, HiX } from 'react-icons/hi';
import useAppStore from '../../store/appStore';
import useLangStore from '../../store/langStore';

const api = window.electronAPI || null;

export default function Header() {
  const { currentPage } = useAppStore();
  const { t } = useLangStore();

  return (
    <header className="h-12 bg-dark-800/50 border-b border-white/[0.06] flex items-center justify-between px-4 titlebar-drag">
      <h2 className="text-sm font-medium text-gray-300 titlebar-no-drag">
        {t.header[currentPage] || ''}
      </h2>

      {/* Window Controls */}
      <div className="flex items-center gap-1 titlebar-no-drag">
        <button
          onClick={() => api?.windowMinimize()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <HiMinus className="w-4 h-4" />
        </button>
        <button
          onClick={() => api?.windowMaximize()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <HiOutlineStop className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => api?.windowClose()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
        >
          <HiX className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
