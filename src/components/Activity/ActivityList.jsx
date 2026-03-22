import React from 'react';
import ActivityCard from './ActivityCard';
import useAppStore from '../../store/appStore';
import useLangStore from '../../store/langStore';

export default function ActivityList() {
  const { activities } = useAppStore();
  const { t } = useLangStore();

  if (activities.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-400 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">{t.activities.empty}</p>
        <p className="text-gray-500 text-xs mt-1">{t.activities.emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {activities.map((activity, index) => (
        <ActivityCard key={activity.id} activity={activity} index={index} />
      ))}
    </div>
  );
}
