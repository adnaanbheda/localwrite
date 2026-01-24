import { FileText, History, List } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Descendant } from 'slate'
import Editor from './components/Editor'
import { FileExplorer } from './components/FileExplorer'
import { HistoryPanel } from './components/HistoryPanel'
import { TableOfContents } from './components/retroui/TableOfContents'
import { ToggleGroup, ToggleGroupItem } from './components/retroui/ToggleGroup'
import { Settings } from './components/Settings'
import { deserialize, serialize } from './lib/markdown'
import { getDirectoryHandle, getVersionHistoryEnabled, listFiles, loadDirectoryHandle, loadLastFile, readFile, saveDirectoryHandle, saveLastFile, setVersionHistoryEnabled, verifyPermission, writeFile } from './lib/storage'

function App() {
  const [files, setFiles] = useState<FileSystemFileHandle[]>([])
  const [currentFile, setCurrentFile] = useState<FileSystemFileHandle | null>(null)
  const [folderName, setFolderName] = useState<string | null>(null)
  const [editorContent, setEditorContent] = useState<Descendant[]>([{ type: 'paragraph', children: [{ text: '' }] }])
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'files' | 'outline' | 'history'>('files')
  const [historyEnabled, setHistoryEnabledState] = useState(false)

  useEffect(() => {
    async function init() {
      const enabled = await getVersionHistoryEnabled()
      setHistoryEnabledState(enabled)

      const handle = await loadDirectoryHandle();
      if (handle) {
        if (await verifyPermission(handle, false)) {
          setDirHandle(handle);
          setFolderName(handle.name);
          const fileList = await listFiles(handle);
          setFiles(fileList);

          // Try to restore last file from URL or Storage
          const params = new URLSearchParams(window.location.search);
          const fileParam = params.get('file');
          const lastFileName = await loadLastFile();

          const fileToOpenName = fileParam || lastFileName;

          if (fileToOpenName) {
            const fileToRestore = fileList.find(f => f.name === fileToOpenName);
            if (fileToRestore) {
              const content = await readFile(fileToRestore);
              setEditorContent(deserialize(content));
              setCurrentFile(fileToRestore);
            }
          }
        }
      }
    }
    init();
  }, [])

  const handleSetFolder = async () => {
    const handle = await getDirectoryHandle()
    if (handle) {
      setDirHandle(handle)
      setFolderName(handle.name)
      await saveDirectoryHandle(handle)
      const fileList = await listFiles(handle)
      setFiles(fileList)
    }
  }

  const handleSelectFile = async (file: FileSystemFileHandle) => {
    if (file === currentFile) return

    // Verify permission for read/write on the specific file if needed, 
    // but usually directory permission covers it.

    const content = await readFile(file)
    const nodes = deserialize(content)
    setEditorContent(nodes)
    setCurrentFile(file)
    await saveLastFile(file.name)

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('file', file.name);
    window.history.replaceState(null, '', url.toString());
  }

  const handleCreateFile = async () => {
    if (!dirHandle) return;

    // Simple prompt for now
    const name = prompt("Enter file name (without extension):");
    if (!name) return;

    const fileName = name.endsWith('.md') ? name : `${name}.md`;

    try {
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      // content default
      await writeFile(fileHandle, "");
      const fileList = await listFiles(dirHandle);
      setFiles(fileList);
      handleSelectFile(fileHandle);
    } catch (e) {
      console.error("Failed to create file", e);
      alert("Failed to create file");
    }
  }

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEditorChange = useCallback((value: Descendant[]) => {
    setEditorContent(value); // Sync local state for HistoryPanel access

    // Switch to outline tab when editing if currently on files tab
    if (sidebarTab === 'files') {
      setSidebarTab('outline');
    }

    if (!currentFile) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const markdown = serialize(value);
      await writeFile(currentFile, markdown);
    }, 1000);
  }, [currentFile, sidebarTab]);

  const handleToggleHistory = async (enabled: boolean) => {
    setHistoryEnabledState(enabled)
    await setVersionHistoryEnabled(enabled)
    if (!enabled && sidebarTab === 'history') {
      setSidebarTab('files')
    }
  }

  const handleRestoreVersion = async (content: string) => {
    const nodes = deserialize(content);
    setEditorContent(nodes);
    // Also save to disk immediately so file system is in sync
    if (currentFile) {
      await writeFile(currentFile, content);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="sidebar-container">
        <div className="flex-grow overflow-y-auto mb-4 flex flex-col">
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
                {historyEnabled && (
                  <ToggleGroupItem value="history" className="justify-start px-3" aria-label="History">
                    <History className="w-4 h-4 mr-3" />
                    History
                  </ToggleGroupItem>
                )}
              </ToggleGroup>

              {sidebarTab === 'files' ? (
                <FileExplorer
                  files={files}
                  onSelectFile={handleSelectFile}
                  onCreateFile={handleCreateFile}
                  currentFile={currentFile}
                />
              ) : sidebarTab === 'outline' ? (
                <div className="h-full overflow-y-auto pr-2">
                  <TableOfContents />
                </div>
              ) : (
                <HistoryPanel
                  dirHandle={dirHandle}
                  currentFile={currentFile}
                  editorContent={editorContent}
                  onRestore={handleRestoreVersion}
                />
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Select a folder in Settings to see files.
            </div>
          )}
        </div>
        <Settings
          onSetFolder={handleSetFolder}
          folderName={folderName}
          historyEnabled={historyEnabled}
          onToggleHistory={handleToggleHistory}
        />
      </div>
      <main className="flex-1 flex flex-col items-center">
        <div className="editor-container">
          <Editor
            value={editorContent}
            onChange={handleEditorChange}
            key={currentFile?.name || 'empty'} // Force remount on file change to reset editor state cleanly
          />
        </div>
      </main>
    </div>
  )
}

export default App
