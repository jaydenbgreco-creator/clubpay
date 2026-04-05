import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
  Settings, Palette, Type, Sun, Moon, Save, Check
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { AdminLayout } from '../components/AdminLayout';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const brandPresets = [
  { name: 'BGCA Official', primary: '#0080c6', accent: '#84bd00', tag: 'Brand' },
  { name: 'Navy', primary: '#004b87', accent: '#84bd00', tag: 'Brand' },
  { name: 'Purple', primary: '#61279e', accent: '#ed40a9', tag: 'Brand' },
  { name: 'Pink', primary: '#ed40a9', accent: '#0080c6', tag: 'Brand' },
];

const otherPresets = [
  { name: 'Emerald', primary: '#10b981', accent: '#f59e0b' },
  { name: 'Rose', primary: '#f43f5e', accent: '#f59e0b' },
  { name: 'Orange', primary: '#f97316', accent: '#0ea5e9' },
  { name: 'Indigo', primary: '#6366f1', accent: '#f59e0b' },
];

const SettingsPage = () => {
  const { settings, refreshSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    app_name: 'ClubPay',
    primary_color: '#0080c6',
    accent_color: '#84bd00',
    theme: 'light'
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        app_name: settings.app_name || 'ClubPay',
        primary_color: settings.primary_color || '#0080c6',
        accent_color: settings.accent_color || '#84bd00',
        theme: settings.theme || 'light'
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/settings`, formData, {
        withCredentials: true
      });
      toast.success('Settings saved!');
      refreshSettings();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to save settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyColorPreset = (preset) => {
    setFormData({
      ...formData,
      primary_color: preset.primary,
      accent_color: preset.accent
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }} data-testid="settings-title">
            <Settings className="w-8 h-8 inline mr-2" style={{ color: formData.primary_color }} />
            App Settings
          </h2>
          <p className="text-slate-500">Customize your ClubPay experience</p>
        </div>

        {/* App Name */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <Type className="w-5 h-5" style={{ color: formData.primary_color }} />
            App Name
          </h3>
          <input
            type="text"
            value={formData.app_name}
            onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
            className="input-field text-xl font-bold"
            placeholder="ClubPay"
            data-testid="app-name-input"
          />
          <p className="text-sm text-slate-400 mt-2">This name appears in the header and login page</p>
        </div>

        {/* Color Theme */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" style={{ color: formData.primary_color }} />
            Color Theme
          </h3>
          
          {/* Brand Kit Presets */}
          <p className="text-sm font-bold text-slate-600 mb-3">BGCA Brand Kit</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {brandPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyColorPreset(preset)}
                className={`relative p-3 rounded-2xl border-2 transition-all ${
                  formData.primary_color === preset.primary && formData.accent_color === preset.accent
                    ? 'border-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid={`preset-${preset.name.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className="flex gap-1 justify-center mb-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: preset.primary }} />
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: preset.accent }} />
                </div>
                <p className="text-xs font-bold text-slate-600 text-center">{preset.name}</p>
                {preset.tag && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 block mt-1 mx-auto w-fit">{preset.tag}</span>
                )}
                {formData.primary_color === preset.primary && formData.accent_color === preset.accent && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <p className="text-sm font-bold text-slate-600 mb-3">Other Presets</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {otherPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyColorPreset(preset)}
                className={`relative p-3 rounded-2xl border-2 transition-all ${
                  formData.primary_color === preset.primary
                    ? 'border-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                data-testid={`preset-${preset.name.toLowerCase()}`}
              >
                <div className="flex gap-1 justify-center mb-2">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary }} />
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.accent }} />
                </div>
                <p className="text-xs font-bold text-slate-600 text-center">{preset.name}</p>
                {formData.primary_color === preset.primary && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Custom Colors */}
          <p className="text-sm font-bold text-slate-600 mb-3">Custom Colors</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-12 h-12 rounded-xl cursor-pointer border-2 border-slate-200"
                  data-testid="primary-color-input"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="input-field flex-1 font-mono"
                  placeholder="#0080c6"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="w-12 h-12 rounded-xl cursor-pointer border-2 border-slate-200"
                  data-testid="accent-color-input"
                />
                <input
                  type="text"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="input-field flex-1 font-mono"
                  placeholder="#84bd00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Theme Mode */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            {formData.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Theme Mode
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFormData({ ...formData, theme: 'light' })}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 ${
                formData.theme === 'light'
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              data-testid="theme-light-btn"
            >
              <Sun className="w-6 h-6 text-amber-500" />
              <span className="font-bold text-slate-900">Light</span>
            </button>
            <button
              onClick={() => setFormData({ ...formData, theme: 'dark' })}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 ${
                formData.theme === 'dark'
                  ? 'border-slate-900 bg-slate-800 text-white'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              data-testid="theme-dark-btn"
            >
              <Moon className="w-6 h-6 text-indigo-400" />
              <span className="font-bold">Dark</span>
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-3">Note: Dark mode is coming soon!</p>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
          <h3 className="font-black text-slate-900 mb-4">Preview</h3>
          <div className="bg-slate-100 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <img src="/brand/logo-horizontal.png" alt="Logo" className="h-8" />
              <span className="font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>{formData.app_name}</span>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-full text-white font-bold text-sm" style={{ backgroundColor: formData.primary_color }}>
                Primary Button
              </button>
              <button className="px-4 py-2 rounded-full text-white font-bold text-sm" style={{ backgroundColor: formData.accent_color }}>
                Accent Button
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full text-white rounded-full font-bold py-4 flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ backgroundColor: formData.primary_color }}
          data-testid="save-settings-btn"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
