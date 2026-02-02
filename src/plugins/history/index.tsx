import { History } from 'lucide-react';
import { HistoryPanel } from '../../components/HistoryPanel';
import type { Plugin } from '../../lib/plugins/types';

export const historyPlugin: Plugin = {
    id: 'history',
    name: 'Version History',
    description: 'Track and restore previous versions of your files.',
    renderSidebarIcon: () => <History className="w-4 h-4 mr-3" />,
    renderSidebarContent: (props: any) => <HistoryPanel {...props} />,
};
