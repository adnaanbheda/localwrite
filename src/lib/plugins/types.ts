import type { ReactNode } from 'react';

export interface PluginContext {
  // Can be expanded to provide core app methods
}

export interface Plugin {
  id: string;
  name: string;
  description: string;

  // Render methods
  renderSidebarIcon?: () => ReactNode;
  renderSidebarContent?: (props: any) => ReactNode;

  // Initialization
  initialize?: (context: PluginContext) => void;
}
