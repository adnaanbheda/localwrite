import { FileText, FolderOpen, Plus } from 'lucide-react'

interface FileExplorerProps {
    files: FileSystemFileHandle[]
    onSelectFile: (file: FileSystemFileHandle) => void
    onCreateFile: () => void
    currentFile: FileSystemFileHandle | null
}

export function FileExplorer({ files, onSelectFile, onCreateFile, currentFile }: FileExplorerProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Files
                </h3>
                <button
                    onClick={onCreateFile}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="New File"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
                {files.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2 text-center">
                        No .md files found or no folder selected.
                    </div>
                ) : (
                    files.map((file, index) => (
                        <button
                            key={index}
                            onClick={() => onSelectFile(file)}
                            className={`w-full text-left px-2 py-1.5 text-sm rounded flex items-center gap-2 transition-colors ${currentFile?.name === file.name
                                    ? 'bg-accent text-accent-foreground font-medium'
                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            <span className="truncate">{file.name}</span>
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}
