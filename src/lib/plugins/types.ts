import type { ReactNode } from 'react';

export interface PluginContext {
  // Core app methods
  setThemeVars: (vars: Record<string, string>) => void;
  unsetThemeVars: (keys: string[]) => void;
  loadStylesheet: (url: string) => void;
  removeStylesheet: (url: string) => void;

  // Persistence & Input
  getSetting: (key: string) => string | null;
  setSetting: (key: string, value: string) => void;
  prompt: (message: string, defaultValue?: string) => Promise<string | null>;
}

export interface PluginSidebarProps {
  dirHandle: FileSystemDirectoryHandle | null;
  currentFile: FileSystemFileHandle | null;
  editorContent: any[]; // Descendant[] from slate, might need generic or decoupled type
  onRestore: (content: string) => void;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;

  // Lifecycle
  initialize?: (context: PluginContext) => void;
  destroy?: (context: PluginContext) => void;

  // Render methods
  renderSidebarIcon?: () => ReactNode;
  renderSidebarContent?: (props: PluginSidebarProps) => ReactNode;
}
