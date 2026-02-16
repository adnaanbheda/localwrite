import { Monitor, Moon, Settings as SettingsIcon, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePlugin } from '../contexts/PluginContext'
import { PluginManager } from './PluginManagerUI'
import { useTheme } from './ThemeProvider'
import { Button } from './retroui/Button'
import { ToggleGroup, ToggleGroupItem } from './retroui/ToggleGroup'


interface SettingsProps {
    onSetFolder: () => void
    folderName: string | null
}

const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {children}
    </label>
)

export function Settings({ onSetFolder, folderName }: SettingsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const { theme, setTheme } = useTheme()
    const { plugins, enabledPlugins } = usePlugin()

    const isCustomThemeActive = plugins.some(p =>
        (p.category === 'theme' || p.id.startsWith('theme-')) &&
        enabledPlugins.includes(p.id)
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Element;
            if (
                containerRef.current &&
                !containerRef.current.contains(target) &&
                !target.closest('[data-popover-content]')
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])
    return (
        <div className="settings-container" ref={containerRef}>
            {isOpen && (
                <div className="settings-popup animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300">
                    <h4 className="mb-2 font-medium leading-none text-foreground">Settings</h4>
                    <p className="text-muted-foreground mb-4">Manage your preferences.</p>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium leading-none">Local Storage</label>
                            <Button
                                variant="secondary"
                                onClick={onSetFolder}
                                className="settings-action-button"
                            >
                                {folderName ? `Using: ${folderName}` : "Set Content Folder"}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium leading-none">Appearance</label>
                            <ToggleGroup
                                type="single"
                                value={theme}
                                onValueChange={(value: string) => {
                                    if (value) setTheme(value as any);
                                }}
                                variant="outlined"
                                size="sm"
                                disabled={isCustomThemeActive}
                                className="w-full bg-secondary/30 p-1 rounded-md border-2 border-border disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ToggleGroupItem value="light" title="Light" className="flex-1">
                                    <Sun className="w-4 h-4" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="dark" title="Dark" className="flex-1">
                                    <Moon className="w-4 h-4" />
                                </ToggleGroupItem>
                                <ToggleGroupItem value="system" title="System" className="flex-1">
                                    <Monitor className="w-4 h-4" />
                                </ToggleGroupItem>
                            </ToggleGroup>
                            {isCustomThemeActive && (
                                <p className="text-[10px] text-muted-foreground mt-1 italic">
                                    Managed by active theme plugin
                                </p>
                            )}
                        </div>

                        <div className="space-y-4 pt-2 border-t border-border">
                            <div className="space-y-2">
                                <Label>Plugins</Label>
                                <PluginManager>
                                    <Button
                                        variant="secondary"
                                        className="settings-action-button"
                                    >
                                        Manage Plugins ({plugins.length})
                                    </Button>
                                </PluginManager>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border">
                            <div className="flex items-center justify-between">
                                <span className="text-foreground">About</span>
                                <a
                                    href={`https://github.com/adnaanbheda/localwrite/releases/tag/v${__APP_VERSION__}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                                >
                                    v{__APP_VERSION__}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="settings-button"
            >
                <SettingsIcon className="h-4 w-4" />
                Settings
            </button>
        </div>
    )
}
