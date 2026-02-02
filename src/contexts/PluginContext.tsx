import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { pluginManager } from '../lib/plugins/PluginManager';
import type { Plugin } from '../lib/plugins/types';

interface PluginContextType {
  plugins: Plugin[];
  enabledPlugins: string[];
  enablePlugin: (pluginId: string) => void;
  disablePlugin: (pluginId: string) => void;
  isPluginEnabled: (pluginId: string) => boolean;
}

const PluginContext = createContext<PluginContextType | undefined>(undefined);

export function PluginProvider({ children }: { children: ReactNode }) {
  const [enabledPlugins, setEnabledPlugins] = useState<string[]>([]);

  // Load initial state from local storage or defaults
  useEffect(() => {
    const stored = localStorage.getItem('enabled_plugins');
    if (stored) {
      setEnabledPlugins(JSON.parse(stored));
    } else {
      // Default enabled plugins
      setEnabledPlugins(['history']);
    }
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

  return (
    <PluginContext.Provider value={{
      plugins: pluginManager.getPlugins(),
      enabledPlugins,
      enablePlugin,
      disablePlugin,
      isPluginEnabled
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
