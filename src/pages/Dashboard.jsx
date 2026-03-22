import React from 'react';
import { HiOutlineLightningBolt, HiOutlineCollection, HiOutlineUserGroup, HiOutlineStatusOnline } from 'react-icons/hi';
import useAppStore from '../store/appStore';
import useLangStore from '../store/langStore';
import ActivityPreview from '../components/Activity/ActivityPreview';

export default function Dashboard() {
  const { activities, rpcConnected, rpcUser, currentActivityIndex, profiles, setPage, connectRPC, clientId } = useAppStore();
  const { t } = useLangStore();
  const currentActivity = currentActivityIndex >= 0 ? activities[currentActivityIndex] : null;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="glass-card p-6 bg-gradient-to-br from-accent-blue/5 to-accent-purple/5">
        <h2 className="text-xl font-bold text-white">
          {rpcUser ? `${rpcUser.username}${t.dashboard.welcome}` : t.dashboard.welcomeDefault}
        </h2>
        <p className="text-sm text-gray-400 mt-1">{t.dashboard.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-gray-400">
            <HiOutlineStatusOnline className="w-4 h-4" />
            <span className="text-xs font-medium">{t.dashboard.status}</span>
          </div>
          <p className="text-lg font-bold text-white mt-1">
            {rpcConnected ? (
              <span className="text-green-400">{t.sidebar.connected}</span>
            ) : (
              <span className="text-gray-500">{t.dashboard.offline}</span>
            )}
          </p>
        </div>
        <div className="stat-card cursor-pointer hover:border-white/[0.12] transition-colors" onClick={() => setPage('activities')}>
          <div className="flex items-center gap-2 text-gray-400">
            <HiOutlineLightningBolt className="w-4 h-4" />
            <span className="text-xs font-medium">{t.dashboard.activities}</span>
          </div>
          <p className="text-lg font-bold text-white mt-1">{activities.length}</p>
        </div>
        <div className="stat-card cursor-pointer hover:border-white/[0.12] transition-colors" onClick={() => setPage('presets')}>
          <div className="flex items-center gap-2 text-gray-400">
            <HiOutlineCollection className="w-4 h-4" />
            <span className="text-xs font-medium">{t.dashboard.presets}</span>
          </div>
          <p className="text-lg font-bold text-white mt-1">14</p>
        </div>
        <div className="stat-card cursor-pointer hover:border-white/[0.12] transition-colors" onClick={() => setPage('profiles')}>
          <div className="flex items-center gap-2 text-gray-400">
            <HiOutlineUserGroup className="w-4 h-4" />
            <span className="text-xs font-medium">{t.dashboard.profiles}</span>
          </div>
          <p className="text-lg font-bold text-white mt-1">{profiles.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr,280px] gap-6">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">{t.dashboard.quickStart}</h3>

          {!clientId && (
            <div className="glass-card p-4 border-yellow-500/20 bg-yellow-500/5">
              <p className="text-sm text-yellow-400 font-medium">{t.dashboard.noClientId}</p>
              <p className="text-xs text-gray-500 mt-1">{t.dashboard.noClientIdDesc}</p>
              <button onClick={() => setPage('settings')} className="mt-3 btn-primary text-xs">{t.dashboard.goToSettings}</button>
            </div>
          )}

          {clientId && !rpcConnected && (
            <div className="glass-card p-4">
              <p className="text-sm text-gray-300">{t.dashboard.notConnected}</p>
              <button onClick={connectRPC} className="mt-3 btn-primary text-xs">{t.dashboard.connectDiscord}</button>
            </div>
          )}

          {rpcConnected && activities.length === 0 && (
            <div className="glass-card p-4">
              <p className="text-sm text-gray-300">{t.dashboard.addActivity}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setPage('activities')} className="btn-primary text-xs">{t.dashboard.addDirect}</button>
                <button onClick={() => setPage('presets')} className="btn-secondary text-xs">{t.dashboard.fromPreset}</button>
              </div>
            </div>
          )}

          {activities.length > 0 && (
            <div className="glass-card p-4">
              <p className="text-xs text-gray-400 mb-3">{t.activities.title}</p>
              <div className="grid gap-2">
                {activities.slice(0, 5).map((act, i) => (
                  <div key={act.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white/90"
                      style={{ backgroundColor: act.color || '#5865F2' }}
                    >
                      {act.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{act.name}</p>
                      <p className="text-xs text-gray-500 truncate">{act.details}</p>
                    </div>
                    {currentActivityIndex === i && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-semibold rounded-full">LIVE</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current Activity Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">{t.dashboard.currentActivity}</h3>
          <ActivityPreview activity={currentActivity} />
        </div>
      </div>
    </div>
  );
}
