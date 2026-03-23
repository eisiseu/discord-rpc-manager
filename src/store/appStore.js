import { create } from 'zustand';

const api = window.electronAPI || null;

const useAppStore = create((set, get) => ({
  // RPC State
  rpcConnected: false,
  rpcUser: null,
  rpcError: null,

  // Data
  clientId: '',
  activities: [],
  profiles: [{ id: 'default', name: '기본 프로필', activities: [] }],
  activeProfileId: 'default',
  currentActivityIndex: -1,
  autoDetect: { enabled: false, mappings: [], interval: 5000 },

  // YouTube Music State
  ytMusic: { enabled: false, port: 8686, clientId: '', showAlbumArt: true, showTimer: true, buttons: [] },
  ytMusicServerRunning: false,
  ytMusicCurrentTrack: null,
  ytMusicExtensionConnected: false,

  // UI State
  currentPage: 'dashboard',
  editingActivity: null,
  showActivityForm: false,

  // Init
  init: async () => {
    if (!api) return;
    const [clientId, activities, profiles, activeProfileId, currentActivityIndex, autoDetect, status, ytMusic, ytMusicStatus] =
      await Promise.all([
        api.getStore('clientId'),
        api.getStore('activities'),
        api.getStore('profiles'),
        api.getStore('activeProfileId'),
        api.getStore('currentActivityIndex'),
        api.getStore('autoDetect'),
        api.rpcGetStatus(),
        api.getStore('ytMusic'),
        api.ytMusicGetStatus(),
      ]);

    set({
      clientId: clientId || '',
      activities: activities || [],
      profiles: profiles || [{ id: 'default', name: '기본 프로필', activities: [] }],
      activeProfileId: activeProfileId || 'default',
      currentActivityIndex: currentActivityIndex ?? -1,
      autoDetect: autoDetect || { enabled: false, mappings: [], interval: 5000 },
      rpcConnected: status.connected,
      rpcUser: status.user,
      ytMusic: ytMusic || { enabled: false, port: 8686, clientId: '', showAlbumArt: true, showTimer: true, buttons: [] },
      ytMusicServerRunning: ytMusicStatus?.running || false,
      ytMusicCurrentTrack: ytMusicStatus?.currentTrack || null,
      ytMusicExtensionConnected: ytMusicStatus?.extensionConnected || false,
    });

    api.onRpcStatus((data) => {
      set({ rpcConnected: data.connected, rpcUser: data.user || null, rpcError: data.error || null });
    });
    api.onActivityChanged((index) => {
      set({ currentActivityIndex: index });
    });
    api.onYtMusicUpdate((data) => {
      set({ ytMusicCurrentTrack: data });
    });
    api.onYtMusicServerStatus((data) => {
      set({ ytMusicServerRunning: data.running });
    });
    api.onYtMusicExtensionStatus((connected) => {
      set({ ytMusicExtensionConnected: connected });
    });
  },

  setPage: (page) => set({ currentPage: page }),

  // Client ID
  setClientId: async (id) => {
    set({ clientId: id });
    if (api) await api.setStore('clientId', id);
  },

  // RPC
  connectRPC: async () => {
    if (api) await api.rpcConnect();
  },
  disconnectRPC: async () => {
    if (api) await api.rpcDisconnect();
    set({ rpcConnected: false, rpcUser: null });
  },

  // Activities
  addActivity: async (activity) => {
    const newActivity = { ...activity, id: Date.now().toString() };
    const activities = [...get().activities, newActivity];
    set({ activities, showActivityForm: false, editingActivity: null });
    if (api) await api.setStore('activities', activities);
  },

  updateActivity: async (id, updates) => {
    const activities = get().activities.map((a) => (a.id === id ? { ...a, ...updates } : a));
    set({ activities, showActivityForm: false, editingActivity: null });
    if (api) await api.setStore('activities', activities);
  },

  deleteActivity: async (id) => {
    const activities = get().activities.filter((a) => a.id !== id);
    const idx = get().currentActivityIndex;
    let newIdx = idx;
    if (idx >= activities.length) newIdx = activities.length - 1;
    set({ activities, currentActivityIndex: newIdx });
    if (api) {
      await api.setStore('activities', activities);
      await api.setStore('currentActivityIndex', newIdx);
    }
  },

  setCurrentActivity: async (index) => {
    const activities = get().activities;
    if (index < 0 || index >= activities.length) return;
    set({ currentActivityIndex: index });
    if (api) {
      await api.setStore('currentActivityIndex', index);
      await api.rpcSetActivity(activities[index]);
    }
  },

  clearActivity: async () => {
    set({ currentActivityIndex: -1 });
    if (api) {
      await api.setStore('currentActivityIndex', -1);
      await api.rpcClearActivity();
    }
  },

  // Activity Form
  openActivityForm: (activity = null) => set({ showActivityForm: true, editingActivity: activity }),
  closeActivityForm: () => set({ showActivityForm: false, editingActivity: null }),

  // Profiles
  addProfile: async (name) => {
    const profile = { id: Date.now().toString(), name, activities: [] };
    const profiles = [...get().profiles, profile];
    set({ profiles });
    if (api) await api.setStore('profiles', profiles);
  },

  deleteProfile: async (id) => {
    if (id === 'default') return;
    const profiles = get().profiles.filter((p) => p.id !== id);
    const activeProfileId = get().activeProfileId === id ? 'default' : get().activeProfileId;
    set({ profiles, activeProfileId });
    if (api) {
      await api.setStore('profiles', profiles);
      await api.setStore('activeProfileId', activeProfileId);
    }
  },

  switchProfile: async (id) => {
    const profile = get().profiles.find((p) => p.id === id);
    if (!profile) return;
    set({
      activeProfileId: id,
      activities: profile.activities || [],
      currentActivityIndex: -1,
    });
    if (api) {
      await api.setStore('activeProfileId', id);
      await api.setStore('activities', profile.activities || []);
      await api.setStore('currentActivityIndex', -1);
      await api.rpcClearActivity();
    }
  },

  saveCurrentToProfile: async () => {
    const { activeProfileId, profiles, activities } = get();
    const updated = profiles.map((p) =>
      p.id === activeProfileId ? { ...p, activities: [...activities] } : p
    );
    set({ profiles: updated });
    if (api) await api.setStore('profiles', updated);
  },

  // Auto Detect
  setAutoDetect: async (config) => {
    set({ autoDetect: config });
    if (api) {
      await api.setStore('autoDetect', config);
      if (config.enabled) await api.processDetectStart();
      else await api.processDetectStop();
    }
  },

  // YouTube Music
  ytMusicToggleServer: async (enabled) => {
    if (!api) return;
    if (enabled) {
      await api.ytMusicStart();
      const config = get().ytMusic;
      await api.ytMusicSetConfig({ ...config, enabled: true });
      set({ ytMusic: { ...config, enabled: true }, ytMusicServerRunning: true });
    } else {
      await api.ytMusicStop();
      const config = get().ytMusic;
      await api.ytMusicSetConfig({ ...config, enabled: false });
      set({ ytMusic: { ...config, enabled: false }, ytMusicServerRunning: false, ytMusicCurrentTrack: null });
    }
  },

  ytMusicUpdateConfig: async (updates) => {
    if (!api) return;
    const config = { ...get().ytMusic, ...updates };
    const result = await api.ytMusicSetConfig(updates);
    set({ ytMusic: result || config });
  },
}));

export default useAppStore;
