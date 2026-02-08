import { FileText, List, Menu, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import type { Descendant } from 'slate'
import Editor from './components/Editor'
import { FileExplorer } from './components/FileExplorer'
import { TableOfContents } from './components/retroui/TableOfContents'
import { ToggleGroup, ToggleGroupItem } from './components/retroui/ToggleGroup'
import { Settings } from './components/Settings'
import { usePlugin } from './contexts/PluginContext'
import { useEditor } from './hooks/useEditor'
import { useFileRestoration } from './hooks/useFileRestoration'
import { useFileSystem } from './hooks/useFileSystem'
import { cn } from './lib/utils'

function App() {
  const { plugins, isPluginEnabled } = usePlugin()

  const {
    dirHandle,
    items,
    folderName,
    init: initFileSystem,
    setFolder,
    createFile
  } = useFileSystem()

  const {
    currentFile,
    editorContent,
    openFile,
    handleEditorChange,
    handleRestoreVersion
  } = useEditor()

  // initialization hook
  useFileRestoration(initFileSystem, openFile);

  const [sidebarTab, setSidebarTab] = useState<'files' | 'outline' | 'history'>('files')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const onEditorChangeWrapped = useCallback((value: Descendant[]) => {
    handleEditorChange(value);
    // Switch to outline tab when editing if currently on files tab
    if (sidebarTab === 'files') {
      setSidebarTab('outline');
    }
  }, [handleEditorChange, sidebarTab]);

  const handleCreateFile = async () => {
    const name = prompt("Enter file name (without extension):");
    if (!name) return;

    try {
      const newHandle = await createFile(name);
      if (newHandle) {
        await openFile(newHandle);
      }
    } catch (e) {
      alert("Failed to create file");
    }
  }

  const SidebarContent = () => (
    <>
      <div className="flex-grow overflow-y-auto mb-4 flex flex-col no-scrollbar">
        {dirHandle ? (
          <>
            <ToggleGroup
              type="single"
              value={sidebarTab}
              onValueChange={(val) => {
                if (val) setSidebarTab(val as any);
              }}
              className="flex flex-col items-stretch gap-1 mb-6 p-0 border-none bg-transparent"
              variant="outlined"
              size="default"
            >
              <ToggleGroupItem value="files" className="justify-start px-3" aria-label="Files">
                <FileText className="w-4 h-4 mr-3" />
                Files
              </ToggleGroupItem>
              <ToggleGroupItem value="outline" className="justify-start px-3" aria-label="Outline">
                <List className="w-4 h-4 mr-3" />
                Outline
              </ToggleGroupItem>
              {plugins.filter(p => isPluginEnabled(p.id) && p.renderSidebarIcon).map(plugin => (
                <ToggleGroupItem key={plugin.id} value={plugin.id} className="justify-start px-3" aria-label={plugin.name}>
                  {plugin.renderSidebarIcon!()}
                  {plugin.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {sidebarTab === 'files' ? (
              <FileExplorer
                items={items}
                onSelectFile={(file) => {
                  openFile(file);
                  setIsMobileMenuOpen(false);
                }}
                onCreateFile={handleCreateFile}
                currentFile={currentFile}
              />
            ) : sidebarTab === 'outline' ? (
              <div className="h-full overflow-y-auto pr-2">
                <TableOfContents />
              </div>
            ) : (
              // Dynamic plugin rendering
              (() => {
                const activePlugin = plugins.find(p => p.id === sidebarTab);
                if (activePlugin && activePlugin.renderSidebarContent) {
                  return activePlugin.renderSidebarContent({
                    dirHandle,
                    currentFile,
                    editorContent,
                    onRestore: (content: string) => {
                      handleRestoreVersion(content);
                      setIsMobileMenuOpen(false);
                    }
                  });
                }
                return null;
              })()
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground p-4 text-center border-2 border-dashed border-border rounded-lg bg-muted/30">
            Select a folder in Settings to begin your focused writing session.
          </div>
        )}
      </div>
      <div className="mt-auto pt-6 border-t border-border">
        <Settings
          onSetFolder={setFolder}
          folderName={folderName}
        />
      </div>
    </>
  )

  return (
    <div className="flex h-screen w-full bg-background flex-col lg:flex-row overflow-hidden">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-muted rounded-md transition-colors border border-border"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-lg font-head">LocalWrite</span>
        </div>
        {currentFile && (
          <span className="text-xs font-medium px-2 py-1 bg-primary border-2 border-foreground shadow-[2px_2px_0_0_#000] truncate max-w-[150px]">
            {currentFile.name}
          </span>
        )}
      </header>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          "mobile-sidebar-overlay",
          isMobileMenuOpen && "mobile-sidebar-overlay-visible"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Sidebar */}
      <div className={cn(
        "mobile-sidebar",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-8">
          <span className="font-bold text-xl font-head tracking-tight">Menu</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-muted rounded-md transition-colors border border-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="sidebar-container">
        <div className="mb-8 p-1">
          <span className="font-bold text-2xl font-head tracking-tighter">LocalWrite</span>
        </div>
        <SidebarContent />
      </div>

      <main className="flex-1 flex flex-col items-center w-full min-w-0 overflow-y-auto">
        <div className="editor-container">
          <Editor
            value={editorContent}
            onChange={onEditorChangeWrapped}
            key={currentFile?.name || 'empty'} // Force remount on file change to reset editor state cleanly
          />
        </div>
      </main>
    </div>
  )
}

export default App
