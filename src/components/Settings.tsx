import { Settings as SettingsIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface SettingsProps {
    onSetFolder: () => void
    folderName: string | null
}

export function Settings({ onSetFolder, folderName }: SettingsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

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
        <div className="relative" ref={containerRef}>
            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-56 rounded-md border border-border bg-card p-4 shadow-lg text-sm">
                    <h4 className="mb-2 font-medium leading-none text-foreground">Settings</h4>
                    <p className="text-muted-foreground mb-4">Manage your preferences.</p>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium leading-none">Local Storage</label>
                            <button
                                onClick={onSetFolder}
                                className="w-full justify-start text-left text-xs bg-secondary/50 hover:bg-secondary p-2 rounded border border-input transition-colors truncat"
                            >
                                {folderName ? `Using: ${folderName}` : "Set Content Folder"}
                            </button>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border">
                            <div className="flex items-center justify-between">
                                <span className="text-foreground">Appearance</span>
                                <span className="text-xs text-muted-foreground">Default</span>
                            </div>
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
                className="flex w-full items-center gap-2 rounded-md p-2 text-sm font-medium transition-colors hover:bg-muted text-foreground"
            >
                <SettingsIcon className="h-4 w-4" />
                Settings
            </button>
        </div>
    )
}
