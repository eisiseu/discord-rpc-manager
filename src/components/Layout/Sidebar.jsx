import React, { useState, useEffect } from 'react';
import { HiOutlineHome, HiOutlineLightningBolt, HiOutlineCollection, HiOutlineUserGroup, HiOutlineCog, HiOutlineMusicNote } from 'react-icons/hi';
import useAppStore from '../../store/appStore';
import useLangStore from '../../store/langStore';

export default function Sidebar() {
  const { currentPage, setPage, rpcConnected, rpcUser } = useAppStore();
  const { t } = useLangStore();
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    const api = window.electronAPI;
    if (api?.getAppVersion) {
      api.getAppVersion().then(setAppVersion).catch(() => {});
    }
  }, []);

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: HiOutlineHome },
    { id: 'activities', label: t.nav.activities, icon: HiOutlineLightningBolt },
    { id: 'presets', label: t.nav.presets, icon: HiOutlineCollection },
    { id: 'profiles', label: t.nav.profiles, icon: HiOutlineUserGroup },
    { id: 'youtubeMusic', label: t.nav.youtubeMusic || 'YouTube Music', icon: HiOutlineMusicNote },
    { id: 'settings', label: t.nav.settings, icon: HiOutlineCog },
  ];

  return (
    <aside className="w-64 h-full bg-dark-800 border-r border-white/[0.06] flex flex-col">
      {/* Logo */}
      <div className="p-6 titlebar-drag">
        <div className="flex items-center gap-3 titlebar-no-drag">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-white font-semibold text-sm">{t.sidebar.appName}</h1>
              {appVersion && <span className="text-gray-600 text-[10px]">v{appVersion}</span>}
            </div>
            <p className="text-gray-500 text-xs">{t.sidebar.appSub}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={isActive ? 'sidebar-item-active w-full' : 'sidebar-item w-full'}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Connection Status */}
      <div className="px-4 py-3 m-3 glass-card flex items-center gap-2 min-w-0">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${rpcConnected ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-500'}`} />
        <span className="text-sm font-semibold text-gray-200 leading-none flex-shrink-0">
          {rpcConnected ? t.sidebar.connected : t.sidebar.disconnected}
        </span>
        {rpcUser && (
          <span className="text-sm text-gray-400 truncate">{rpcUser.username}</span>
        )}
      </div>
    </aside>
  );
}
