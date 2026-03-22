import { create } from 'zustand';
import translations from '../i18n';

const api = window.electronAPI || null;

const useLangStore = create((set, get) => ({
  lang: 'ko',
  t: translations['ko'],

  init: async () => {
    const saved = api ? await api.getStore('lang') : localStorage.getItem('lang');
    const lang = saved || 'ko';
    set({ lang, t: translations[lang] || translations['ko'] });
  },

  setLang: async (lang) => {
    set({ lang, t: translations[lang] || translations['ko'] });
    if (api) await api.setStore('lang', lang);
    else localStorage.setItem('lang', lang);
  },
}));

export default useLangStore;
