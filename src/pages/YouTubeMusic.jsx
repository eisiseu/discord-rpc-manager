import React, { useState } from 'react';
import { HiOutlineMusicNote, HiOutlineStatusOnline, HiOutlineServer, HiOutlineCog } from 'react-icons/hi';
import useAppStore from '../store/appStore';
import useLangStore from '../store/langStore';

export default function YouTubeMusic() {
  const {
    ytMusic, ytMusicServerRunning, ytMusicCurrentTrack, ytMusicExtensionConnected,
    ytMusicToggleServer, ytMusicUpdateConfig, rpcConnected,
  } = useAppStore();
  const { t } = useLangStore();

  const [editPort, setEditPort] = useState(ytMusic.port || 8686);
  const [editClientId, setEditClientId] = useState(ytMusic.clientId || '');
  const [showSettings, setShowSettings] = useState(false);
  const [showClientId, setShowClientId] = useState(false);

  const yt = t.ytMusic || {};

  const handleToggle = () => {
    ytMusicToggleServer(!ytMusicServerRunning);
  };

  const handleSaveSettings = async () => {
    const port = parseInt(editPort);
    if (port < 1024 || port > 65535) return;
    await ytMusicUpdateConfig({
      port,
      clientId: editClientId,
    });
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const track = ytMusicCurrentTrack;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 bg-gradient-to-br from-red-500/10 to-red-900/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <HiOutlineMusicNote className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{yt.title || 'YouTube Music'}</h2>
            <p className="text-sm text-gray-400">{yt.subtitle || 'Share your music to Discord'}</p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Server Status */}
        <div className="stat-card">
          <div className="flex items-center gap-2 text-gray-400">
            <HiOutlineServer className="w-4 h-4" />
            <span className="text-xs font-medium">{yt.server || 'HTTP Server'}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2.5 h-2.5 rounded-full ${ytMusicServerRunning ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-500'}`} />
            <span className={`text-sm font-semibold ${ytMusicServerRunning ? 'text-green-400' : 'text-gray-500'}`}>
              {ytMusicServerRunning ? (yt.running || 'Running') : (yt.stopped || 'Stopped')}
            </span>
          </div>
          {ytMusicServerRunning && (
            <p className="text-xs text-gray-500 mt-1">127.0.0.1:{ytMusic.port || 8686}</p>
          )}
        </div>

        {/* Extension Status */}
        <div className="stat-card">
          <div className="flex items-center gap-2 text-gray-400">
            <HiOutlineStatusOnline className="w-4 h-4" />
            <span className="text-xs font-medium">{yt.extension || 'Extension'}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2.5 h-2.5 rounded-full ${ytMusicExtensionConnected ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-500'}`} />
            <span className={`text-sm font-semibold ${ytMusicExtensionConnected ? 'text-green-400' : 'text-gray-500'}`}>
              {ytMusicExtensionConnected ? (yt.receiving || 'Receiving') : (yt.waiting || 'Waiting')}
            </span>
          </div>
        </div>

        {/* Discord RPC */}
        <div className="stat-card">
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            <span className="text-xs font-medium">Discord RPC</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2.5 h-2.5 rounded-full ${rpcConnected ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-500'}`} />
            <span className={`text-sm font-semibold ${rpcConnected ? 'text-green-400' : 'text-gray-500'}`}>
              {rpcConnected ? (yt.rpcConnected || 'Connected') : (yt.rpcDisconnected || 'Disconnected')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr,280px] gap-6">
        <div className="space-y-4">
          {/* Toggle Server */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">{yt.serverToggle || 'HTTP Server'}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{yt.serverDesc || 'Receive data from Chrome extension'}</p>
              </div>
              <button
                onClick={handleToggle}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  ytMusicServerRunning ? 'bg-red-500' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  ytMusicServerRunning ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>

          {/* Now Playing */}
          {track && track.title ? (
            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {yt.nowPlaying || 'Now Playing'}
              </h3>
              <div className="flex items-center gap-4">
                {track.thumbnail && (
                  <img
                    src={track.thumbnail}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{track.title}</p>
                  <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                  {track.album && (
                    <p className="text-xs text-gray-500 truncate">{track.album}</p>
                  )}
                  {track.duration > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                        <span>{formatTime(track.currentTime)}</span>
                        <span>{formatTime(track.duration)}</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all duration-1000"
                          style={{ width: `${(track.currentTime / track.duration) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-6 text-center">
              <HiOutlineMusicNote className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{yt.noTrack || 'No track playing'}</p>
              <p className="text-xs text-gray-600 mt-1">
                {ytMusicServerRunning
                  ? (yt.waitingExtension || 'Waiting for Chrome extension data...')
                  : (yt.enableServer || 'Enable the HTTP server to start')}
              </p>
            </div>
          )}

          {/* Settings */}
          <div className="glass-card p-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-300 w-full"
            >
              <HiOutlineCog className="w-4 h-4" />
              <span>{yt.settings || 'Settings'}</span>
              <svg className={`w-4 h-4 ml-auto transition-transform ${showSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSettings && (
              <div className="mt-4 space-y-4">
                {/* Port */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">{yt.port || 'Port'}</label>
                  <input
                    type="number"
                    value={editPort}
                    onChange={(e) => setEditPort(e.target.value)}
                    min="1024"
                    max="65535"
                    className="input-field w-32"
                  />
                </div>

                {/* Client ID */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">{yt.clientIdLabel || 'Discord Client ID (YouTube Music)'}</label>
                  <div className="relative" onClick={() => !showClientId && ytMusic.clientId && setShowClientId(true)}>
                    <input
                      type="text"
                      value={editClientId}
                      onChange={(e) => setEditClientId(e.target.value)}
                      onFocus={() => setShowClientId(true)}
                      onBlur={() => setTimeout(() => setShowClientId(false), 200)}
                      placeholder={yt.clientIdPlaceholder || 'Leave empty to use default'}
                      className={`input-field w-full ${ytMusic.clientId && !showClientId ? 'blur-sm select-none pointer-events-none' : ''}`}
                    />
                    {ytMusic.clientId && !showClientId && (
                      <div className="absolute inset-0 flex items-center justify-center cursor-pointer rounded-xl">
                        <span className="text-xs text-gray-400">Click to reveal</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Show Album Art */}
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300">{yt.showAlbumArt || 'Show album art'}</span>
                  <button
                    onClick={() => ytMusicUpdateConfig({ showAlbumArt: !ytMusic.showAlbumArt })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      ytMusic.showAlbumArt ? 'bg-red-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      ytMusic.showAlbumArt ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </label>

                {/* Show Timer */}
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-300">{yt.showTimer || 'Show progress timer'}</span>
                  <button
                    onClick={() => ytMusicUpdateConfig({ showTimer: !ytMusic.showTimer })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      ytMusic.showTimer ? 'bg-red-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      ytMusic.showTimer ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>
                </label>

                <button onClick={handleSaveSettings} className="btn-primary text-xs">
                  {yt.save || 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Discord Preview */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300">{yt.preview || 'Discord Preview'}</h3>
          <div className="rounded-lg bg-[#111214] overflow-hidden">
            <div className="px-4 pt-3 pb-2">
              <p className="text-[11px] uppercase font-semibold text-gray-400 tracking-wide">
                {yt.playingActivity || 'PLAYING'}
              </p>
            </div>
            <div className="px-4 pb-3">
              <div className="flex gap-3">
                {/* Album Art */}
                <div className="relative flex-shrink-0">
                  {track?.thumbnail && ytMusic.showAlbumArt ? (
                    <img src={track.thumbnail} alt="" className="w-[60px] h-[60px] rounded-lg object-cover" />
                  ) : (
                    <div className="w-[60px] h-[60px] rounded-lg bg-red-500/20 flex items-center justify-center">
                      <HiOutlineMusicNote className="w-6 h-6 text-red-400" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#111214] p-[3px]">
                    <div className="w-full h-full rounded-full bg-red-500 flex items-center justify-center">
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-sm font-semibold text-white truncate leading-tight">
                    {track?.title || 'YouTube Music'}
                  </p>
                  {track?.artist && (
                    <p className="text-xs text-gray-300 truncate leading-tight mt-0.5">{track.artist}</p>
                  )}
                  {track?.album && (
                    <p className="text-xs text-gray-300 truncate leading-tight mt-0.5">{track.album}</p>
                  )}
                  {track?.duration > 0 && ytMusic.showTimer && (
                    <p className="text-xs text-gray-400 leading-tight mt-0.5">
                      {formatTime(track.currentTime)} / {formatTime(track.duration)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Button preview */}
            {track?.url && (
              <div className="px-4 pb-3">
                <div className="w-full py-1.5 rounded text-xs font-medium text-white bg-[#4e5058] text-center">
                  YouTube Music에서 듣기
                </div>
              </div>
            )}
          </div>

          {/* Guide */}
          <div className="glass-card p-3">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">{yt.guide || 'How to use'}</h4>
            <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
              <li>{yt.step1 || 'Enable the HTTP server above'}</li>
              <li>{yt.step2 || 'Install Chrome extension'}</li>
              <li>{yt.step3 || 'Open YouTube Music and play a song'}</li>
              <li>{yt.step4 || 'Your Discord will show the track!'}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
