import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { installPlugin, restoreInstalledPlugins, uninstallPlugin as uninstallPluginFromLoader } from '../lib/plugins/PluginLoader';
import { pluginManager } from '../lib/plugins/PluginManager';
import type { Plugin } from '../lib/plugins/types';

interface PluginContextType {
  plugins: Plugin[];
  enabledPlugins: string[];
  enablePlugin: (pluginId: string) => void;
  disablePlugin: (pluginId: string) => void;
  isPluginEnabled: (pluginId: string) => boolean;
  installPlugin: (url: string) => Promise<void>;
  isLoading: boolean;
  setThemeVars: (vars: Record<string, string>) => void;
  unsetThemeVars: (keys: string[]) => void;
  loadStylesheet: (url: string) => void;
  removeStylesheet: (url: string) => void;

  // App-level methods (not exposed to plugins directly, but used by Runner/Settings)
  uninstallPlugin: (pluginId: string) => void;
  getPluginSetting: (pluginId: string, key: string) => string | null;
  setPluginSetting: (pluginId: string, key: string, value: string) => void;
}

const PluginContext = createContext<PluginContextType | undefined>(undefined);

export function PluginProvider({ children }: { children: ReactNode }) {
  const [plugins, setPlugins] = useState<Plugin[]>(pluginManager.getPlugins());
  const [enabledPlugins, setEnabledPlugins] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Settings: Record<pluginId, Record<key, value>>
  const [settings, setSettings] = useState<Record<string, Record<string, string>>>({});

  // Load initial state
  useEffect(() => {
    const loadPlugins = async () => {
      await restoreInstalledPlugins();
      setPlugins(pluginManager.getPlugins());

      const storedEnabled = localStorage.getItem('enabled_plugins');
      if (storedEnabled) setEnabledPlugins(JSON.parse(storedEnabled));
      else setEnabledPlugins(['history']);

      const storedSettings = localStorage.getItem('plugin_settings');
      if (storedSettings) setSettings(JSON.parse(storedSettings));

      setIsLoading(false);
    };
    loadPlugins();
  }, []);

  const saveEnabledState = (newEnabled: string[]) => {
    localStorage.setItem('enabled_plugins', JSON.stringify(newEnabled));
    setEnabledPlugins(newEnabled);
  };

  const saveSettingsState = (newSettings: Record<string, Record<string, string>>) => {
    localStorage.setItem('plugin_settings', JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  const enablePlugin = (pluginId: string) => {
    if (!enabledPlugins.includes(pluginId)) {
      saveEnabledState([...enabledPlugins, pluginId]);
    }
  };

  const disablePlugin = (pluginId: string) => {
    saveEnabledState(enabledPlugins.filter(id => id !== pluginId));
  };

  const uninstallPlugin = (pluginId: string) => {
    // 1. Disable
    disablePlugin(pluginId);

    // 2. Remove settings
    const newSettings = { ...settings };
    delete newSettings[pluginId];
    saveSettingsState(newSettings);

    // 3. Remove from installed list (localStorage) & Manager
    uninstallPluginFromLoader(pluginId);

    // 4. Update local state
    setPlugins(pluginManager.getPlugins());
  };

  const isPluginEnabled = (pluginId: string) => {
    return enabledPlugins.includes(pluginId);
  };

  const handleInstallPlugin = async (url: string) => {
    setIsLoading(true);
    try {
      const plugin = await installPlugin(url);
      if (plugin) {
        setPlugins(pluginManager.getPlugins());
        enablePlugin(plugin.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPluginSetting = (pluginId: string, key: string) => {
    return settings[pluginId]?.[key] || null;
  };

  const setPluginSetting = (pluginId: string, key: string, value: string) => {
    const newSettings = { ...settings };
    if (!newSettings[pluginId]) newSettings[pluginId] = {};
    newSettings[pluginId][key] = value;
    saveSettingsState(newSettings);
  };

  return (
    <PluginContext.Provider value={{
      plugins,
      enabledPlugins,
      enablePlugin,
      disablePlugin,
      isPluginEnabled,
      installPlugin: handleInstallPlugin,
      uninstallPlugin,
      isLoading,
      setThemeVars: (vars) => {
        const root = document.documentElement;
        Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
      },
      unsetThemeVars: (keys) => {
        const root = document.documentElement;
        keys.forEach(key => root.style.removeProperty(key));
      },
      loadStylesheet: (url) => {
        if (!document.querySelector(`link[href="${url}"]`)) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = url;
          document.head.appendChild(link);
        }
      },
      removeStylesheet: (url) => {
        const link = document.querySelector(`link[href="${url}"]`);
        if (link) document.head.removeChild(link);
      },
      getPluginSetting,
      setPluginSetting
    }}>
      {children}
    </PluginContext.Provider>
  );
}

export function usePlugin() {
  const context = useContext(PluginContext);
  if (context === undefined) {
    throw new Error('usePlugin must be used within a PluginProvider');
  }
  return context;
}
