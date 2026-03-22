import React from 'react';
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlay, HiOutlineStop } from 'react-icons/hi';
import useAppStore from '../../store/appStore';
import useLangStore from '../../store/langStore';

export default function ActivityCard({ activity, index }) {
  const { currentActivityIndex, setCurrentActivity, clearActivity, deleteActivity, openActivityForm } = useAppStore();
  const { t } = useLangStore();
  const isActive = currentActivityIndex === index;

  return (
    <div className={`glass-card-hover px-3 py-2.5 ${isActive ? 'border-accent-blue/30 glow-blue' : ''}`}>
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white/90 flex-shrink-0"
          style={{ backgroundColor: activity.color || '#5865F2' }}
        >
          {activity.name?.[0] || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white truncate">{activity.name}</h3>
            {isActive && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-semibold rounded-full flex-shrink-0">
                {t.activities.live}
              </span>
            )}
          </div>
          {(activity.details || activity.state) && (
            <p className="text-xs text-gray-500 truncate">
              {[activity.details, activity.state].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          {isActive ? (
            <button onClick={() => clearActivity()} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title={t.activities.stop}>
              <HiOutlineStop className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={() => setCurrentActivity(index)} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors" title={t.activities.activate}>
              <HiOutlinePlay className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => openActivityForm(activity)} className="p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors" title={t.activities.edit}>
            <HiOutlinePencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => deleteActivity(activity.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors" title={t.activities.delete}>
            <HiOutlineTrash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
