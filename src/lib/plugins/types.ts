import type { ReactNode } from 'react';

export interface PluginContext {
  // Can be expanded to provide core app methods
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
  description: string;

  // Render methods
  renderSidebarIcon?: () => ReactNode;
  renderSidebarContent?: (props: PluginSidebarProps) => ReactNode;

  // Initialization
  initialize?: (context: PluginContext) => void;
}
