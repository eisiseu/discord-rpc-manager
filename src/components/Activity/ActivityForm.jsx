import React, { useState, useEffect, useCallback } from 'react';
import { HiX, HiPlus, HiOutlineTrash } from 'react-icons/hi';
import useAppStore from '../../store/appStore';
import useLangStore from '../../store/langStore';
import ActivityPreview from './ActivityPreview';

const api = window.electronAPI || null;
const colorOptions = ['#5865F2', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#e87d0d', '#ec4899', '#0db4b9'];

export default function ActivityForm() {
  const { editingActivity, addActivity, updateActivity, closeActivityForm } = useAppStore();
  const { t } = useLangStore();

  const [form, setForm] = useState({
    name: 'App Profile',
    clientId: '',
    details: '',
    state: '작업중',
    showTimer: true,
    buttons: [],
    color: '#5865F2',
    processName: '',
  });
  const [appNameLoading, setAppNameLoading] = useState(false);
  const [processSuggestions, setProcessSuggestions] = useState([]);
  const [showProcessDropdown, setShowProcessDropdown] = useState(false);

  useEffect(() => {
    if (editingActivity) {
      const merged = {
        name: 'App Profile',
        clientId: '',
        details: '',
        state: '작업중',
        showTimer: true,
        buttons: [],
        color: '#5865F2',
        processName: '',
        ...editingActivity,
      };
      // name is only determined by Client ID, not by details
      if (!merged.clientId) merged.name = 'App Profile';
      setForm(merged);
      // If has Client ID, refresh the app name
      if (merged.clientId) lookupAppName(merged.clientId);
    }
  }, [editingActivity]);

  // Auto-detect Discord app name when Client ID changes
  const lookupAppName = useCallback(async (clientId) => {
    if (!clientId || clientId.length < 15) return;
    setAppNameLoading(true);
    try {
      const name = api ? await api.getDiscordAppName(clientId) : null;
      if (name) {
        setForm((f) => ({ ...f, name: name }));
      }
    } catch { /* ignore */ }
    setAppNameLoading(false);
  }, []);

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleClientIdChange = (value) => {
    updateField('clientId', value);
    if (value.length >= 15) {
      lookupAppName(value);
    } else {
      updateField('name', 'App Profile');
    }
  };

  const loadProcesses = async () => {
    if (!api) return;
    try {
      const processes = await api.getRunningProcesses();
      setProcessSuggestions(processes.sort());
      setShowProcessDropdown(true);
    } catch { /* ignore */ }
  };

  const filteredSuggestions = form.processName
    ? processSuggestions.filter(p => p.toLowerCase().includes(form.processName.toLowerCase()))
    : processSuggestions;

  const addButton = () => {
    if (form.buttons.length >= 2) return;
    setForm((f) => ({ ...f, buttons: [...f.buttons, { label: '', url: '' }] }));
  };

  const updateButton = (index, field, value) => {
    const buttons = form.buttons.map((b, i) => (i === index ? { ...b, [field]: value } : b));
    setForm((f) => ({ ...f, buttons }));
  };

  const removeButton = (index) => {
    setForm((f) => ({ ...f, buttons: f.buttons.filter((_, i) => i !== index) }));
  };

  const hasAppName = form.name && form.name !== 'App Profile';
  const canSubmit = form.details.trim() || hasAppName;

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (editingActivity) {
      updateActivity(editingActivity.id, form);
    } else {
      addActivity(form);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-700 border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white">
            {editingActivity ? t.form.editTitle : t.form.addTitle}
          </h2>
          <button onClick={closeActivityForm} className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
            <HiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-[1fr,220px] gap-5">
          {/* Form Fields */}
          <div className="space-y-4">
            {/* App Name (auto) + Client ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.form.appName}</label>
                <div className="input-field text-gray-400 flex items-center gap-2">
                  <span className="truncate">{form.name || 'App Profile'}</span>
                  {appNameLoading && <span className="text-[10px] text-accent-blue animate-pulse">...</span>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Application Client ID</label>
                <input className="input-field" placeholder={t.form.activityClientIdPlaceholder || '활동별 Client ID (선택)'} value={form.clientId || ''} onChange={(e) => handleClientIdChange(e.target.value)} />
              </div>
            </div>

            {/* Program Name (details) */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">프로그램 이름 {hasAppName ? '' : t.form.required}</label>
              <input className="input-field" placeholder="예: MotionBuilder" value={form.details} onChange={(e) => updateField('details', e.target.value)} />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.form.state}</label>
              <input className="input-field" placeholder={t.form.statePlaceholder} value={form.state} onChange={(e) => updateField('state', e.target.value)} />
            </div>

            {/* Process Name with suggestions */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.form.processName}</label>
              <input
                className="input-field"
                placeholder={t.form.processNamePlaceholder}
                value={form.processName}
                onChange={(e) => { updateField('processName', e.target.value); if (!showProcessDropdown) loadProcesses(); }}
                onFocus={loadProcesses}
                onBlur={() => setTimeout(() => setShowProcessDropdown(false), 200)}
              />
              {showProcessDropdown && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-dark-800 border border-white/10 rounded-xl shadow-xl">
                  {filteredSuggestions.slice(0, 50).map((p) => (
                    <button
                      key={p}
                      onMouseDown={(e) => { e.preventDefault(); updateField('processName', p); setShowProcessDropdown(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors truncate"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.form.themeColor}</label>
              <div className="flex gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateField('color', c)}
                    className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-700 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Timer toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-5 rounded-full relative transition-colors ${form.showTimer ? 'bg-accent-blue' : 'bg-dark-400'}`}
                onClick={() => updateField('showTimer', !form.showTimer)}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.showTimer ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-gray-300">{t.form.showTimer}</span>
            </label>

            {/* Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-400">{t.form.buttons}</label>
                {form.buttons.length < 2 && (
                  <button onClick={addButton} className="flex items-center gap-1 text-xs text-accent-blue hover:text-accent-blue/80 transition-colors">
                    <HiPlus className="w-3.5 h-3.5" /> {t.form.addButton}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {form.buttons.map((btn, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input className="input-field flex-1" placeholder={t.form.buttonLabel} value={btn.label} onChange={(e) => updateButton(i, 'label', e.target.value)} />
                    <input className="input-field flex-1" placeholder={t.form.buttonUrl} value={btn.url} onChange={(e) => updateButton(i, 'url', e.target.value)} />
                    <button onClick={() => removeButton(i)} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-400">{t.form.preview}</p>
            <ActivityPreview activity={form} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-white/[0.06]">
          <button onClick={closeActivityForm} className="btn-secondary">{t.form.cancel}</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={!canSubmit}>
            {editingActivity ? t.form.save : t.form.add}
          </button>
        </div>
      </div>
    </div>
  );
}
