import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { installPlugin, restoreInstalledPlugins } from '../lib/plugins/PluginLoader';
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
}

const PluginContext = createContext<PluginContextType | undefined>(undefined);

export function PluginProvider({ children }: { children: ReactNode }) {
  const [plugins, setPlugins] = useState<Plugin[]>(pluginManager.getPlugins());
  const [enabledPlugins, setEnabledPlugins] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial state from local storage or defaults
  useEffect(() => {
    const loadPlugins = async () => {
      // 1. Restore installed dynamic plugins
      await restoreInstalledPlugins();
      setPlugins(pluginManager.getPlugins());

      // 2. Restore enabled state
      const stored = localStorage.getItem('enabled_plugins');
      if (stored) {
        setEnabledPlugins(JSON.parse(stored));
      } else {
        // Default enabled plugins
        setEnabledPlugins(['history']);
      }
      setIsLoading(false);
    };
    loadPlugins();
  }, []);

  const saveState = (plugins: string[]) => {
    localStorage.setItem('enabled_plugins', JSON.stringify(plugins));
    setEnabledPlugins(plugins);
  };

  const enablePlugin = (pluginId: string) => {
    if (!enabledPlugins.includes(pluginId)) {
      saveState([...enabledPlugins, pluginId]);
    }
  };

  const disablePlugin = (pluginId: string) => {
    saveState(enabledPlugins.filter(id => id !== pluginId));
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
        // Auto-enable newly installed plugins?
        enablePlugin(plugin.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PluginContext.Provider value={{
      plugins,
      enabledPlugins,
      enablePlugin,
      disablePlugin,
      isPluginEnabled,
      installPlugin: handleInstallPlugin,
      isLoading,
      setThemeVars: (vars: Record<string, string>) => {
        const root = document.documentElement;
        Object.entries(vars).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
      },
      unsetThemeVars: (keys: string[]) => {
        const root = document.documentElement;
        keys.forEach(key => {
          root.style.removeProperty(key);
        });
      }
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
