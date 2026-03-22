import React, { useState, useEffect } from 'react';
import useLangStore from '../../store/langStore';

const api = window.electronAPI || null;

const openUrl = (url) => {
  if (!url) return;
  if (api?.shell) api.shell.openExternal(url);
  else window.open(url, '_blank', 'noopener,noreferrer');
};

export default function ActivityPreview({ activity }) {
  const { t } = useLangStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activity?.showTimer) return;
    setElapsed(0);
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [activity]);

  if (!activity) {
    return (
      <div className="rounded-lg bg-[#111214] p-4 text-center">
        <p className="text-gray-500 text-sm">{t.preview.noActivity}</p>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="rounded-lg bg-[#111214] overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[11px] uppercase font-semibold text-gray-400 tracking-wide">
          {t.preview.title}
        </p>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <div className="flex gap-3">
          {/* Large Image */}
          <div className="relative flex-shrink-0">
            <div
              className="w-[60px] h-[60px] rounded-lg flex items-center justify-center text-xl font-bold text-white/90"
              style={{ backgroundColor: activity.color || '#5865F2' }}
            >
              {activity.name?.[0] || '?'}
            </div>
            {/* Small Image Overlay */}
            {activity.smallImageKey && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#111214] p-[3px]">
                <div
                  className="w-full h-full rounded-full flex items-center justify-center text-[6px] font-bold text-white"
                  style={{ backgroundColor: activity.color || '#5865F2' }}
                >
                  {activity.name?.[1] || ''}
                </div>
              </div>
            )}
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {activity.name || t.preview.appName}
            </p>
            {activity.details && (
              <p className="text-xs text-gray-300 truncate leading-tight mt-0.5">{activity.details}</p>
            )}
            {activity.state && (
              <p className="text-xs text-gray-300 truncate leading-tight mt-0.5">{activity.state}</p>
            )}
            {activity.showTimer && (
              <p className="text-xs text-gray-400 leading-tight mt-0.5">
                {formatTime(elapsed)} {t.preview.elapsed}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      {activity.buttons && activity.buttons.length > 0 && (
        <div className="px-4 pb-3 space-y-1">
          {activity.buttons.filter((b) => b.label).map((btn, i) => (
            <button
              key={i}
              onClick={() => openUrl(btn.url)}
              className={`w-full py-1.5 rounded text-xs font-medium text-white transition-colors
                ${btn.url
                  ? 'bg-[#4e5058] hover:bg-[#6d6f78] cursor-pointer'
                  : 'bg-[#4e5058] opacity-50 cursor-not-allowed'
                }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
