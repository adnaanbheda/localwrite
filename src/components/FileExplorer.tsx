import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen, Plus } from 'lucide-react'
import { useState } from 'react'
import type { FileSystemItem } from '../lib/storage'

interface FileExplorerProps {
    items: FileSystemItem[]
    onSelectFile: (file: FileSystemFileHandle) => void
    onCreateFile: () => void
    currentFile: FileSystemFileHandle | null
}

function FileTreeItem({ item, depth, onSelectFile, currentFile }: {
    item: FileSystemItem,
    depth: number,
    onSelectFile: (file: FileSystemFileHandle) => void,
    currentFile: FileSystemFileHandle | null
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (item.kind === 'file') {
        const isSelected = currentFile?.name === item.name; // Weak check by name, but handles are objects. 
        // Note: handle comparison checks reference. 
        // Ideally we compare handles by `isSameEntry` but that's async. 
        // Using name check for UI highlight logic within same session is okay usually if checking same directory, 
        // but robust apps use path strings. localwrite seems to use handles.
        // App.tsx uses content matching or handle reference match `file === currentFile`.
        // Let's rely on name match + exact object match if possible, or just name for now if simplified. 
        // Actually, let's assume we pass the *handle* equality check if we can, or just name.
        // The original code did `currentFile?.name === file.name`. I'll stick to that.

        return (
            <button
                onClick={() => onSelectFile(item.handle as FileSystemFileHandle)}
                className={`w-full text-left px-2 py-1.5 text-sm rounded flex items-center gap-2 transition-colors ${isSelected
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                <span className="w-4 h-4 shrink-0" />
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
            </button>
        );
    }

    return (
        <div className="flex flex-col">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left px-2 py-1.5 text-sm rounded flex items-center gap-2 transition-colors hover:bg-muted text-foreground font-medium"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                {isExpanded ? <FolderOpen className="w-4 h-4 shrink-0 text-primary" /> : <Folder className="w-4 h-4 shrink-0 text-primary" />}
                <span className="truncate">{item.name}</span>
            </button>
            {isExpanded && item.children && (
                <div>
                    {item.children.map((child, idx) => (
                        <FileTreeItem
                            key={`${child.name}-${idx}`}
                            item={child}
                            depth={depth + 1}
                            onSelectFile={onSelectFile}
                            currentFile={currentFile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FileExplorer({ items, onSelectFile, onCreateFile, currentFile }: FileExplorerProps) {
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

            <div className="flex-1 overflow-y-auto space-y-0.5">
                {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2 text-center">
                        No files found or no folder selected.
                    </div>
                ) : (
                    items.map((item, index) => (
                        <FileTreeItem
                            key={`${item.name}-${index}`}
                            item={item}
                            depth={0}
                            onSelectFile={onSelectFile}
                            currentFile={currentFile}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
