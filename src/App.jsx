import React, { useEffect } from 'react';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Activities from './pages/Activities';
import Presets from './pages/Presets';
import Profiles from './pages/Profiles';
import SettingsPage from './pages/SettingsPage';
import ActivityForm from './components/Activity/ActivityForm';
import ToastContainer from './components/Toast';
import useAppStore from './store/appStore';
import useLangStore from './store/langStore';

const pages = {
  dashboard: Dashboard,
  activities: Activities,
  presets: Presets,
  profiles: Profiles,
  settings: SettingsPage,
};

export default function App() {
  const { currentPage, showActivityForm, init } = useAppStore();
  const { init: initLang } = useLangStore();

  useEffect(() => {
    init();
    initLang();
  }, []);

  const PageComponent = pages[currentPage] || Dashboard;

  return (
    <Layout>
      <PageComponent />
      {showActivityForm && <ActivityForm />}
      <ToastContainer />
    </Layout>
  );
}
