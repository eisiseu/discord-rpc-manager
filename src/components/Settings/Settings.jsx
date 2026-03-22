import React, { useState, useEffect } from 'react';
import { HiOutlineLink, HiOutlineLightningBolt, HiExternalLink, HiOutlineTranslate } from 'react-icons/hi';
import useAppStore from '../../store/appStore';
import useLangStore from '../../store/langStore';
import { languages } from '../../i18n';
import AutoDetect from './AutoDetect';

const api = window.electronAPI || null;

const openExternal = (url) => {
  if (api?.shell) api.shell.openExternal(url);
  else window.open(url, '_blank');
};

export default function SettingsPanel() {
  const { clientId, setClientId, rpcConnected, connectRPC, disconnectRPC, rpcUser, rpcError } = useAppStore();
  const { t, lang, setLang } = useLangStore();
  const [localClientId, setLocalClientId] = useState(clientId);
  const [showClientId, setShowClientId] = useState(false);

  useEffect(() => { setLocalClientId(clientId); }, [clientId]);

  const handleSaveClientId = () => setClientId(localClientId.trim());

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Language */}
      <div className="glass-card p-5">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineTranslate className="w-5 h-5 text-accent-cyan" />
          {t.settings.language}
        </h3>
        <div className="flex gap-2 flex-wrap">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                lang === l.code
                  ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-lg shadow-accent-blue/20'
                  : 'bg-dark-400 border border-white/10 text-gray-300 hover:bg-dark-300 hover:text-white'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Discord Connection */}
      <div className="glass-card p-5">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineLink className="w-5 h-5 text-accent-blue" />
          {t.settings.title}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{t.settings.clientIdLabel}</label>
            <div className="flex gap-2">
              <div className="relative flex-1" onClick={() => !showClientId && clientId && setShowClientId(true)}>
                <input
                  className={`input-field w-full ${clientId && !showClientId ? 'blur-sm select-none pointer-events-none' : ''}`}
                  placeholder={t.settings.clientIdPlaceholder}
                  value={localClientId}
                  onChange={(e) => setLocalClientId(e.target.value)}
                  onFocus={() => setShowClientId(true)}
                  onBlur={() => setTimeout(() => setShowClientId(false), 200)}
                />
                {clientId && !showClientId && (
                  <div className="absolute inset-0 flex items-center justify-center cursor-pointer rounded-xl">
                    <span className="text-xs text-gray-400">Click to reveal</span>
                  </div>
                )}
              </div>
              <button onClick={handleSaveClientId} className="btn-secondary">{t.settings.save}</button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">{t.settings.clientIdDesc}</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-dark-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${rpcConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
              <div>
                <p className="text-sm text-white font-medium">
                  {rpcConnected ? t.settings.connected : t.settings.disconnected}
                </p>
                {rpcUser && <p className="text-xs text-gray-500">{rpcUser.username}</p>}
                {rpcError && <p className="text-xs text-red-400">{rpcError}</p>}
              </div>
            </div>
            <button
              onClick={rpcConnected ? disconnectRPC : connectRPC}
              className={rpcConnected ? 'btn-secondary text-red-400' : 'btn-primary'}
            >
              {rpcConnected ? t.settings.disconnect : t.settings.connect}
            </button>
          </div>
        </div>
      </div>

      {/* Auto Detect */}
      <AutoDetect />

      {/* Setup Guide */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <HiOutlineLightningBolt className="w-5 h-5 text-accent-purple" />
            {t.settings.guideTitle}
          </h3>
          <button
            onClick={() => openExternal('https://discord.com/developers/applications')}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <HiExternalLink className="w-3.5 h-3.5" />
            {t.settings.openPortal}
          </button>
        </div>

        <ol className="space-y-4">
          {t.settings.guideSteps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-white">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
