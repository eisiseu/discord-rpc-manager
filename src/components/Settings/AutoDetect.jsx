import React, { useState } from 'react';
import { HiOutlineEye, HiPlus, HiOutlineTrash, HiOutlineRefresh, HiOutlineSearch } from 'react-icons/hi';
import useAppStore from '../../store/appStore';
import useLangStore from '../../store/langStore';

const api = window.electronAPI || null;

// 프로세스 이름 → 앱 아이콘 이모지 매핑
const PROCESS_ICONS = {
  'motionbuilder': '🎬', 'maya': '🎨', 'blender': '🟠', 'unrealed': '🎮',
  'unity': '⚙️', 'photoshop': '🖼️', 'afterfx': '✨', 'premiere': '🎞️',
  'code': '💻', '3dsmax': '🔷', 'zbrush': '🗿', 'substance': '🎨',
  'figma': '🖌️', 'resolve': '🎬', 'illustrator': '🖊️', 'indesign': '📐',
  'chrome': '🌐', 'firefox': '🦊', 'msedge': '🌐', 'spotify': '🎵',
  'discord': '💬', 'slack': '💼', 'zoom': '📹', 'teams': '📹',
  'steam': '🎮', 'obs': '📡', 'vlc': '🎬', 'notepad': '📝',
  'explorer': '📁', 'powershell': '⚡', 'cmd': '⬛', 'python': '🐍',
  'node': '🟩', 'git': '🔀', 'rider': '🖥️', 'pycharm': '🐍',
  'webstorm': '🌐', 'clion': '⚙️', 'idea': '☕', 'eclipse': '☕',
  'excel': '📊', 'word': '📄', 'powerpoint': '📊', 'outlook': '📧',
};

function getProcessIcon(processName) {
  const lower = processName.toLowerCase().replace('.exe', '');
  for (const [key, icon] of Object.entries(PROCESS_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '⚙️';
}

export default function AutoDetect() {
  const { autoDetect, setAutoDetect, activities } = useAppStore();
  const { t } = useLangStore();
  const [runningProcesses, setRunningProcesses] = useState([]);
  const [processIcons, setProcessIcons] = useState({});
  const [showProcesses, setShowProcesses] = useState(false);
  const [processSearch, setProcessSearch] = useState('');
  const [scanning, setScanning] = useState(false);

  const toggleEnabled = () => setAutoDetect({ ...autoDetect, enabled: !autoDetect.enabled });

  const addMapping = (processName = '') => {
    const mappings = [...(autoDetect.mappings || []), { processName, activityId: '', priority: autoDetect.mappings?.length || 0 }];
    setAutoDetect({ ...autoDetect, mappings });
  };

  const updateMapping = (index, field, value) => {
    const mappings = autoDetect.mappings.map((m, i) => (i === index ? { ...m, [field]: value } : m));
    setAutoDetect({ ...autoDetect, mappings });
  };

  const removeMapping = (index) => {
    const mappings = autoDetect.mappings.filter((_, i) => i !== index);
    setAutoDetect({ ...autoDetect, mappings });
  };

  const scanProcesses = async () => {
    if (!api) {
      const dummy = ['motionbuilder.exe', 'maya.exe', 'blender.exe', 'Code.exe', 'chrome.exe', 'discord.exe', 'spotify.exe', 'explorer.exe'];
      setRunningProcesses(dummy);
      setShowProcesses(true);
      return;
    }
    setScanning(true);
    const processes = await api.getRunningProcesses();
    const sorted = processes.sort();
    setRunningProcesses(sorted);
    setShowProcesses(true);
    setScanning(false);

    // 아이콘 일괄 로드 (백그라운드)
    api.getAppIconsBatch(sorted).then((icons) => {
      setProcessIcons(icons || {});
    });
  };

  const filteredProcesses = processSearch
    ? runningProcesses.filter(p => p.toLowerCase().includes(processSearch.toLowerCase()))
    : runningProcesses;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <HiOutlineEye className="w-5 h-5 text-accent-cyan" />
          {t.settings.autoDetectTitle}
        </h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <span className="text-sm text-gray-400">{autoDetect.enabled ? t.settings.autoDetectOn : t.settings.autoDetectOff}</span>
          <div
            className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${autoDetect.enabled ? 'bg-accent-blue' : 'bg-dark-400'}`}
            onClick={toggleEnabled}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoDetect.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>

      <p className="text-xs text-gray-500 mb-4">{t.settings.autoDetectDesc}</p>

      {/* Scan button */}
      <button onClick={scanProcesses} disabled={scanning} className="btn-secondary flex items-center gap-2 mb-4">
        <HiOutlineRefresh className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
        {t.settings.scanProcesses}
      </button>

      {/* Process list */}
      {showProcesses && runningProcesses.length > 0 && (
        <div className="mb-4 rounded-xl border border-white/[0.06] overflow-hidden">
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-dark-800 border-b border-white/[0.06]">
            <HiOutlineSearch className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-600 outline-none"
              placeholder="프로세스 검색..."
              value={processSearch}
              onChange={e => setProcessSearch(e.target.value)}
            />
            <span className="text-[10px] text-gray-600 flex-shrink-0">{filteredProcesses.length}개</span>
          </div>

          {/* Scrollable list — 무제한 */}
          <div className="max-h-72 overflow-y-auto bg-dark-800/50">
            {filteredProcesses.map((p) => (
              <button
                key={p}
                onClick={() => addMapping(p)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors group text-left"
              >
                <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
                  {processIcons[p]
                    ? <img src={processIcons[p]} alt={p} className="w-7 h-7 object-contain rounded" />
                    : <span className="text-lg">{getProcessIcon(p)}</span>
                  }
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white truncate flex-1 transition-colors">{p}</span>
                <HiPlus className="w-3.5 h-3.5 text-gray-600 group-hover:text-accent-blue opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mappings */}
      <div className="space-y-2">
        {(autoDetect.mappings || []).map((mapping, i) => (
          <div key={i} className="flex gap-2 items-center bg-dark-800/50 p-2.5 rounded-xl border border-white/[0.04]">
            <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center">
              {processIcons[mapping.processName]
                ? <img src={processIcons[mapping.processName]} alt={mapping.processName} className="w-7 h-7 object-contain rounded" />
                : <span className="text-lg">{getProcessIcon(mapping.processName)}</span>
              }
            </div>
            <input
              className="input-field flex-1 text-xs py-1.5"
              placeholder={t.settings.processPlaceholder}
              value={mapping.processName}
              onChange={(e) => updateMapping(i, 'processName', e.target.value)}
            />
            <select
              className="input-field flex-1 text-xs py-1.5"
              value={mapping.activityId}
              onChange={(e) => updateMapping(i, 'activityId', e.target.value)}
            >
              <option value="">{t.settings.selectActivity}</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <button onClick={() => removeMapping(i)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors flex-shrink-0">
              <HiOutlineTrash className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button onClick={() => addMapping()} className="mt-3 flex items-center gap-1 text-xs text-accent-blue hover:text-accent-blue/80 transition-colors">
        <HiPlus className="w-3.5 h-3.5" /> {t.settings.addMapping}
      </button>
    </div>
  );
}
