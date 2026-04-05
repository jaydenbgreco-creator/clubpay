import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const SettingsContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

const applyTheme = (s) => {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', s.primary_color);
  root.style.setProperty('--accent-color', s.accent_color);
  document.title = s.app_name;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    app_name: 'ClubPay',
    primary_color: '#0080c6',
    accent_color: '#84bd00',
    theme: 'light'
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/settings/public`);
      setSettings(response.data);
      applyTheme(response.data);
    } catch {
      // Failed to load settings - keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refreshSettings = useCallback(() => {
    fetchSettings();
  }, [fetchSettings]);

  const contextValue = useMemo(() => ({
    settings,
    loading,
    refreshSettings
  }), [settings, loading, refreshSettings]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
