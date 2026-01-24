import { FileText, List } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Descendant } from 'slate'
import Editor from './components/Editor'
import { FileExplorer } from './components/FileExplorer'
import { TableOfContents } from './components/retroui/TableOfContents'
import { Settings } from './components/Settings'
import { deserialize, serialize } from './lib/markdown'
import { getDirectoryHandle, listFiles, loadDirectoryHandle, loadLastFile, readFile, saveDirectoryHandle, saveLastFile, verifyPermission, writeFile } from './lib/storage'

function App() {
  const [files, setFiles] = useState<FileSystemFileHandle[]>([])
  const [currentFile, setCurrentFile] = useState<FileSystemFileHandle | null>(null)
  const [folderName, setFolderName] = useState<string | null>(null)
  const [editorContent, setEditorContent] = useState<Descendant[]>([{ type: 'paragraph', children: [{ text: '' }] }])
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [sidebarTab, setSidebarTab] = useState<'files' | 'outline'>('files')

  useEffect(() => {
    async function init() {
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
    if (!currentFile) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const markdown = serialize(value);
      await writeFile(currentFile, markdown);
    }, 1000);
  }, [currentFile]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="sidebar-container">
        <div className="flex-grow overflow-y-auto mb-4 flex flex-col">
          {dirHandle ? (
            <>
              <div className="sidebar-toggle-group">
                <button
                  onClick={() => setSidebarTab('files')}
                  className={`sidebar-toggle-btn ${sidebarTab === 'files'
                    ? 'sidebar-toggle-btn-active'
                    : 'sidebar-toggle-btn-inactive'
                    }`}
                >
                  <FileText className="w-3 h-3" />
                  Files
                </button>
                <button
                  onClick={() => setSidebarTab('outline')}
                  className={`sidebar-toggle-btn ${sidebarTab === 'outline'
                    ? 'sidebar-toggle-btn-active'
                    : 'sidebar-toggle-btn-inactive'
                    }`}
                >
                  <List className="w-3 h-3" />
                  Outline
                </button>
              </div>

              {sidebarTab === 'files' ? (
                <FileExplorer
                  files={files}
                  onSelectFile={handleSelectFile}
                  onCreateFile={handleCreateFile}
                  currentFile={currentFile}
                />
              ) : (
                <div className="h-full overflow-y-auto pr-2">
                  <TableOfContents />
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Select a folder in Settings to see files.
            </div>
          )}
        </div>
        <Settings onSetFolder={handleSetFolder} folderName={folderName} />
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
