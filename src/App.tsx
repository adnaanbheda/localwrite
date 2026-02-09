
import { Menu, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { Descendant } from 'slate'
import Editor from './components/Editor'
import { Sidebar } from './components/Sidebar'
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

  const [sidebarTab, setSidebarTab] = useState<'files' | 'outline' | string>('files')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleEditorChangeWrapped = useCallback((value: Descendant[]) => {
    handleEditorChange(value);
  }, [handleEditorChange]);

  // Update window title based on folder name
  useEffect(() => {
    if (folderName) {
      document.title = `localwrite | ${folderName}`;
    } else {
      document.title = 'localwrite';
    }
  }, [folderName]);

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



  // Common props for Sidebar
  const sidebarProps = {
    dirHandle,
    items,
    currentFile,
    editorContent,
    folderName,
    sidebarTab,
    setSidebarTab,
    onSelectFile: (file: FileSystemFileHandle) => {
      openFile(file);
      setIsMobileMenuOpen(false);
    },
    onCreateFile: handleCreateFile,
    onSetFolder: setFolder,
    onRestoreVersion: (content: string) => {
      handleRestoreVersion(content);
      setIsMobileMenuOpen(false);
    },
    plugins,
    isPluginEnabled
  };

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
          <span className="font-bold text-lg font-head">localwrite</span>
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
        <Sidebar {...sidebarProps} />
      </div>

      {/* Desktop Sidebar */}
      <div className="sidebar-container">
        <div className="mb-8 p-1">
          <span className="font-bold text-2xl font-head tracking-tighter">localwrite</span>
        </div>
        <Sidebar {...sidebarProps} />
      </div>

      <main className="flex-1 flex flex-col items-center w-full min-w-0 overflow-y-auto">
        <div className="editor-container">
          <Editor
            value={editorContent}
            onChange={handleEditorChangeWrapped}
            onHeadingActive={() => {
              if (sidebarTab === 'files') {
                setSidebarTab('outline');
              }
            }}
            key={currentFile?.name || 'empty'} // Force remount on file change to reset editor state cleanly
          />
        </div>
      </main>
    </div>
  )
}

export default App
