import type { Plugin, PluginSidebarProps } from '@/lib/plugins/types';
import { History } from 'lucide-react';
import { HistoryPanel } from './HistoryPanel';

export const historyPlugin: Plugin = {
    id: 'history',
    name: 'Version History',
    description: 'Track and restore previous versions of your files.',
    renderSidebarIcon: () => <History className="w-4 h-4 mr-3" />,
    renderSidebarContent: (props: PluginSidebarProps) => <HistoryPanel {...props} />,
};
