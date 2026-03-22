import React from 'react';
import { HiPlus, HiCheck } from 'react-icons/hi';
import useAppStore from '../../store/appStore';
import useLangStore from '../../store/langStore';
import { showToast } from '../Toast';

export default function PresetCard({ preset }) {
  const { addActivity, activities } = useAppStore();
  const { t } = useLangStore();

  const alreadyAdded = activities.some((a) => a.name === preset.name);

  const handleAdd = () => {
    if (alreadyAdded) {
      showToast(`"${preset.name}"${t.presets.alreadyAddedMsg}`, 'warning');
      return;
    }
    const { category, ...activityData } = preset;
    addActivity(activityData);
    showToast(`"${preset.name}" ${t.presets.added}`);
  };

  return (
    <div className="glass-card-hover p-4">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white/90 flex-shrink-0"
          style={{ backgroundColor: preset.color || '#5865F2' }}
        >
          {preset.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{preset.name}</h3>
          <p className="text-xs text-gray-400 truncate">{preset.details}</p>
          <span className="inline-block mt-1.5 px-2 py-0.5 bg-dark-400/50 rounded-md text-[10px] text-gray-500">
            {preset.category}
          </span>
        </div>
        <button
          onClick={handleAdd}
          className={`p-2 rounded-lg transition-all flex-shrink-0 ${
            alreadyAdded
              ? 'bg-green-500/20 text-green-400 cursor-default'
              : 'text-gray-400 hover:bg-accent-blue/10 hover:text-accent-blue'
          }`}
          title={alreadyAdded ? t.presets.alreadyAdded : t.presets.addToActivity}
        >
          {alreadyAdded ? <HiCheck className="w-4 h-4" /> : <HiPlus className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
