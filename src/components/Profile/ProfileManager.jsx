import React, { useState } from 'react';
import { HiPlus, HiOutlineTrash, HiOutlineSwitchHorizontal, HiOutlineSave } from 'react-icons/hi';
import useAppStore from '../../store/appStore';
import useLangStore from '../../store/langStore';

export default function ProfileManager() {
  const { profiles, activeProfileId, addProfile, deleteProfile, switchProfile, saveCurrentToProfile } = useAppStore();
  const { t } = useLangStore();
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = () => {
    if (!newName.trim()) return;
    addProfile(newName.trim());
    setNewName('');
    setShowCreate(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{t.profiles.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{t.profiles.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={saveCurrentToProfile} className="btn-secondary flex items-center gap-2">
            <HiOutlineSave className="w-4 h-4" /> {t.profiles.saveCurrentBtn}
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
            <HiPlus className="w-4 h-4" /> {t.profiles.newProfileBtn}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass-card p-4 flex gap-3">
          <input
            className="input-field flex-1"
            placeholder={t.profiles.namePlaceholder}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button onClick={handleCreate} className="btn-primary">{t.profiles.create}</button>
          <button onClick={() => setShowCreate(false)} className="btn-ghost">{t.profiles.cancel}</button>
        </div>
      )}

      {/* Profile list */}
      <div className="grid gap-3">
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId;
          return (
            <div key={profile.id} className={`glass-card-hover p-4 ${isActive ? 'border-accent-blue/30' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${isActive ? 'bg-gradient-to-br from-accent-blue to-accent-purple' : 'bg-dark-400'}`}>
                    {profile.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{profile.name}</h4>
                      {isActive && (
                        <span className="px-2 py-0.5 bg-accent-blue/20 text-accent-blue text-[10px] font-semibold rounded-full">
                          {t.profiles.active}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {(profile.activities || []).length}{t.profiles.activities}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!isActive && (
                    <button
                      onClick={() => switchProfile(profile.id)}
                      className="p-2 rounded-lg text-gray-400 hover:bg-accent-blue/10 hover:text-accent-blue transition-colors"
                      title={t.profiles.switch}
                    >
                      <HiOutlineSwitchHorizontal className="w-4 h-4" />
                    </button>
                  )}
                  {profile.id !== 'default' && (
                    <button
                      onClick={() => deleteProfile(profile.id)}
                      className="p-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      title={t.profiles.delete}
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
