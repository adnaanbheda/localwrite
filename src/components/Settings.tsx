import { Monitor, Moon, Settings as SettingsIcon, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePlugin } from '../contexts/PluginContext'
import { useTheme } from './ThemeProvider'
import { Switch } from './retroui/Switch'

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
    const { plugins, enablePlugin, disablePlugin, isPluginEnabled } = usePlugin()

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
                <div className="settings-popup">
                    <h4 className="mb-2 font-medium leading-none text-foreground">Settings</h4>
                    <p className="text-muted-foreground mb-4">Manage your preferences.</p>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium leading-none">Local Storage</label>
                            <button
                                onClick={onSetFolder}
                                className="settings-action-button"
                            >
                                {folderName ? `Using: ${folderName}` : "Set Content Folder"}
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium leading-none">Appearance</label>
                            <div className="theme-toggle-group">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={`theme-toggle-btn ${theme === 'light' ? 'theme-toggle-btn-active' : 'theme-toggle-btn-inactive'}`}
                                    title="Light"
                                >
                                    <Sun className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={`theme-toggle-btn ${theme === 'dark' ? 'theme-toggle-btn-active' : 'theme-toggle-btn-inactive'}`}
                                    title="Dark"
                                >
                                    <Moon className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => setTheme("system")}
                                    className={`theme-toggle-btn ${theme === 'system' ? 'theme-toggle-btn-active' : 'theme-toggle-btn-inactive'}`}
                                    title="System"
                                >
                                    <Monitor className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2 border-t border-border">
                            <div className="space-y-2">
                                <Label>Plugins</Label>
                                <div className="space-y-2">
                                    {plugins.map(plugin => (
                                        <div key={plugin.id} className="flex items-center justify-between p-2 border border-border rounded-md bg-secondary/20">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{plugin.name}</span>
                                                <span className="text-xs text-muted-foreground">{plugin.description}</span>
                                            </div>
                                            <Switch
                                                checked={isPluginEnabled(plugin.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) enablePlugin(plugin.id);
                                                    else disablePlugin(plugin.id);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border">
                            <div className="flex items-center justify-between">
                                <span className="text-foreground">About</span>
                                <span className="text-xs text-muted-foreground">v0.1.0</span>
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
