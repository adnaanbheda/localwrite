import { FileText, List } from 'lucide-react'
import type { Descendant } from 'slate'
import type { FileSystemItem } from '../lib/storage'
import { FileExplorer } from './FileExplorer'
import { Settings } from './Settings'
import { SidebarAPI } from './SidebarAPI'
import { TableOfContents } from './retroui/TableOfContents'

// Props needed for the smart component
interface SidebarProps {
    dirHandle: FileSystemDirectoryHandle | null
    items: FileSystemItem[]
    currentFile: FileSystemFileHandle | null
    editorContent: Descendant[]
    folderName: string | null
    sidebarTab: 'files' | 'outline' | string
    setSidebarTab: (tab: 'files' | 'outline' | string) => void
    onSelectFile: (file: FileSystemFileHandle) => void
    onCreateFile: () => void
    onSetFolder: () => void
    onRestoreVersion: (content: string) => void
    plugins: any[] // Typing this properly would be better, but 'any' matches previous implied usage
    isPluginEnabled: (id: string) => boolean
}

export function Sidebar({
    dirHandle,
    items,
    currentFile,
    editorContent,
    folderName,
    sidebarTab,
    setSidebarTab,
    onSelectFile,
    onCreateFile,
    onSetFolder,
    onRestoreVersion,
    plugins,
    isPluginEnabled
}: SidebarProps) {
    return (
        <SidebarAPI.Root>
            <SidebarAPI.Content>
                {dirHandle ? (
                    <>
                        <SidebarAPI.Group>
                            <SidebarAPI.Item
                                icon={FileText}
                                active={sidebarTab === 'files'}
                                onClick={() => setSidebarTab('files')}
                            >
                                Files
                            </SidebarAPI.Item>
                            <SidebarAPI.Item
                                icon={List}
                                active={sidebarTab === 'outline'}
                                onClick={() => setSidebarTab('outline')}
                            >
                                Outline
                            </SidebarAPI.Item>
                            {plugins.filter(p => isPluginEnabled(p.id) && p.renderSidebarIcon).map(plugin => (
                                <SidebarAPI.Item
                                    key={plugin.id}
                                    active={sidebarTab === plugin.id}
                                    onClick={() => setSidebarTab(plugin.id as any)}
                                >
                                    {plugin.renderSidebarIcon!()}
                                    <span>{plugin.name}</span>
                                </SidebarAPI.Item>
                            ))}
                        </SidebarAPI.Group>

                        <SidebarAPI.Switch value={sidebarTab}>
                            <SidebarAPI.Case value="files">
                                <FileExplorer
                                    items={items}
                                    onSelectFile={onSelectFile}
                                    onCreateFile={onCreateFile}
                                    currentFile={currentFile}
                                />
                            </SidebarAPI.Case>
                            <SidebarAPI.Case value="outline">
                                <div className="h-full overflow-y-auto pr-2">
                                    <TableOfContents />
                                </div>
                            </SidebarAPI.Case>
                            {plugins.filter(p => isPluginEnabled(p.id) && p.renderSidebarContent).map(plugin => (
                                <SidebarAPI.Case key={plugin.id} value={plugin.id}>
                                    {plugin.renderSidebarContent!({
                                        dirHandle,
                                        currentFile,
                                        editorContent,
                                        onRestore: onRestoreVersion
                                    })}
                                </SidebarAPI.Case>
                            ))}
                        </SidebarAPI.Switch>
                    </>
                ) : (
                    <div className="text-sm text-muted-foreground p-4 text-center border-2 border-dashed border-border rounded-lg bg-muted/30">
                        Select a folder in Settings to begin your focused writing session.
                    </div>
                )}
            </SidebarAPI.Content>
            <SidebarAPI.Footer>
                <Settings
                    onSetFolder={onSetFolder}
                    folderName={folderName}
                />
            </SidebarAPI.Footer>
        </SidebarAPI.Root>
    )
}


