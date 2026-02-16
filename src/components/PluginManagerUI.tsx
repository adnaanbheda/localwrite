import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePlugin } from '../contexts/PluginContext';
import { Button } from './retroui/Button';
import { Popover } from './retroui/Popover';
import { Switch } from './retroui/Switch';

export function PluginManager({ children }: { children: React.ReactNode }) {
    const { plugins, enablePlugin, disablePlugin, isPluginEnabled, installPlugin, uninstallPlugin } = usePlugin();
    const [installUrl, setInstallUrl] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleInstall = async () => {
        if (!installUrl) return;
        try {
            await installPlugin(installUrl);
            setInstallUrl('');
            toast.success('Plugin installed successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to install plugin. Check console for details.');
        }
    };

    return (
        <Popover>
            <Popover.Trigger asChild>
                {children}
            </Popover.Trigger>
            <Popover.Content
                className="w-[calc(100vw-2rem)] sm:w-[500px] p-0"
                align={isMobile ? "center" : "start"}
                side={isMobile ? "top" : "right"}
                sideOffset={isMobile ? 15 : 20}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-border bg-muted/20">
                    <div>
                        <h2 className="text-lg font-head font-bold text-foreground">Plugin Manager</h2>
                        <p className="text-sm text-muted-foreground">Manage and install extensions.</p>
                    </div>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">

                    {/* Install Section */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none font-head">Install Plugin</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={installUrl}
                                onChange={(e) => setInstallUrl(e.target.value)}
                                placeholder="https://example.com/plugin.js"
                                className="flex-1 px-3 py-2 text-sm border-2 border-border rounded-md bg-secondary/50 focus:outline-none focus:ring-0 focus:border-primary font-mono"
                                onKeyDown={(e) => e.key === 'Enter' && handleInstall()}
                            />
                            <Button
                                onClick={handleInstall}
                                size="sm"
                            >
                                Install
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Enter a URL to a JavaScript plugin file.
                        </p>
                    </div>

                    {/* Plugin List */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium leading-none font-head">Installed Plugins</label>
                        <div className="space-y-2">
                            {plugins.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-md">
                                    No plugins installed.
                                </div>
                            ) : (
                                plugins.map(plugin => (
                                    <div key={plugin.id} className="flex items-center justify-between p-3 border-2 border-border rounded-md bg-card">
                                        <div className="flex flex-col gap-1 max-w-[70%]">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm font-head">{plugin.name}</span>
                                                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded border border-border text-secondary-foreground">v{plugin.version}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground truncate" title={plugin.description}>
                                                {plugin.description}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={isPluginEnabled(plugin.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) enablePlugin(plugin.id);
                                                    else disablePlugin(plugin.id);
                                                }}
                                            />
                                            <Button
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to uninstall ${plugin.name}?`)) {
                                                        uninstallPlugin(plugin.id);
                                                    }
                                                }}
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                title="Uninstall"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t-2 border-border bg-secondary/20">
                    <p className="text-xs text-center text-muted-foreground">
                        Plugins run with full access. Only install from trusted sources.
                    </p>
                </div>
            </Popover.Content>
        </Popover>
    );
}
