import { useCallback, useEffect, useState } from 'react'
import type { Descendant } from 'slate'
import Editor from './components/Editor'
import { FileExplorer } from './components/FileExplorer'
import { Settings } from './components/Settings'
import { deserialize, serialize } from './lib/markdown'
import { getDirectoryHandle, listFiles, loadDirectoryHandle, readFile, saveDirectoryHandle, verifyPermission, writeFile } from './lib/storage'

function App() {
  const [files, setFiles] = useState<FileSystemFileHandle[]>([])
  const [currentFile, setCurrentFile] = useState<FileSystemFileHandle | null>(null)
  const [folderName, setFolderName] = useState<string | null>(null)
  const [editorContent, setEditorContent] = useState<Descendant[]>([{ type: 'paragraph', children: [{ text: '' }] }])
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null)

  useEffect(() => {
    async function init() {
      const handle = await loadDirectoryHandle();
      if (handle) {
        if (await verifyPermission(handle, false)) {
          setDirHandle(handle);
          setFolderName(handle.name);
          const fileList = await listFiles(handle);
          setFiles(fileList);
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

  const handleEditorChange = useCallback(async (value: Descendant[]) => {
    if (!currentFile) return;

    // Debounce or just save? For simplicity, save on every change (might be slow for large files)
    // Ideally use a debounced save.
    // Let's implement a simple debounce here? 
    // Actually, relying on state update frequency might be okay for local MVP. 

    const markdown = serialize(value);
    await writeFile(currentFile, markdown);
  }, [currentFile]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="sticky top-0 h-screen w-64 flex-shrink-0 flex flex-col border-r border-border bg-card p-6 hidden lg:flex">
        <div className="flex-grow overflow-y-auto mb-4">
          {dirHandle ? (
            <FileExplorer
              files={files}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              currentFile={currentFile}
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              Select a folder in Settings to see files.
            </div>
          )}
        </div>
        <Settings onSetFolder={handleSetFolder} folderName={folderName} />
      </div>
      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-[850px] py-12 px-4 sm:px-6 lg:px-8">
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
