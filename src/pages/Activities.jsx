import React from 'react';
import { HiPlus } from 'react-icons/hi';
import useAppStore from '../store/appStore';
import useLangStore from '../store/langStore';
import ActivityList from '../components/Activity/ActivityList';
import ActivityPreview from '../components/Activity/ActivityPreview';

export default function Activities() {
  const { openActivityForm, activities, currentActivityIndex } = useAppStore();
  const { t } = useLangStore();
  const currentActivity = currentActivityIndex >= 0 ? activities[currentActivityIndex] : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{t.activities.title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t.activities.subtitle}</p>
        </div>
        <button onClick={() => openActivityForm()} className="btn-primary flex items-center gap-2">
          <HiPlus className="w-4 h-4" /> {t.activities.newActivity}
        </button>
      </div>

      <div className="grid grid-cols-[1fr,250px] gap-5 items-start">
        <ActivityList />
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-400">{t.activities.previewTitle}</p>
          <ActivityPreview activity={currentActivity} />
        </div>
      </div>
    </div>
  );
}
