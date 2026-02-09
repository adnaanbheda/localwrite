import { Button } from '@/components/retroui/Button';
import { SidebarAPI } from '@/components/SidebarAPI';
import { serialize } from '@/lib/markdown';
import { History, RotateCcw, Save } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Descendant } from 'slate';
import { type Version, getVersionContent, getVersions, saveVersion } from './storage';

interface HistoryPanelProps {
    dirHandle: FileSystemDirectoryHandle | null;
    currentFile: FileSystemFileHandle | null;
    editorContent: Descendant[];
    onRestore: (content: string) => void;
}

export function HistoryPanel({ dirHandle, currentFile, editorContent, onRestore }: HistoryPanelProps) {
    const [versions, setVersions] = useState<Version[]>([]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-save refs
    const lastAutoSaveTime = useRef<number>(Date.now());
    const lastSavedContent = useRef<string>('');
    const initialLoadDone = useRef(false);

    useEffect(() => {
        loadVersions();
    }, [dirHandle, currentFile]);

    // Auto-save logic
    useEffect(() => {
        if (!dirHandle || !currentFile || !editorContent) return;

        const currentMarkdown = serialize(editorContent);

        // Skip first load or empty content
        if (!initialLoadDone.current) {
            lastSavedContent.current = currentMarkdown;
            initialLoadDone.current = true;
            return;
        }

        // Check if content changed
        if (currentMarkdown !== lastSavedContent.current) {
            const now = Date.now();
            const timeSinceLastSave = now - lastAutoSaveTime.current;
            const AUTO_SAVE_INTERVAL = 10 * 60 * 1000; // 10 minutes

            if (timeSinceLastSave > AUTO_SAVE_INTERVAL) {
                // Trigger auto-save
                console.log("Auto-saving history...");
                saveVersion(dirHandle, currentFile.name, currentMarkdown, 'Auto-save', 'auto')
                    .then(() => {
                        lastAutoSaveTime.current = now;
                        lastSavedContent.current = currentMarkdown;
                        loadVersions(); // Refresh list
                    })
                    .catch(err => console.error("Auto-save failed:", err));
            }
        }
    }, [editorContent, dirHandle, currentFile]);

    async function loadVersions() {
        if (!dirHandle || !currentFile) {
            setVersions([]);
            return;
        }
        setLoading(true);
        const list = await getVersions(dirHandle, currentFile.name);
        setVersions(list);
        setLoading(false);
    }

    async function handleCommit() {
        if (!dirHandle || !currentFile) return;

        const content = serialize(editorContent);
        await saveVersion(dirHandle, currentFile.name, content, note, 'manual');
        setNote('');

        // Reset auto-save timer/content on manual commit too, to avoid duplicate immediate auto-save
        lastAutoSaveTime.current = Date.now();
        lastSavedContent.current = content;

        loadVersions();
    }

    async function handleRestore(version: Version) {
        if (!dirHandle) return;
        if (confirm(`Are you sure you want to restore version from ${new Date(version.timestamp).toLocaleString()}? Current unsaved changes will be lost.`)) {
            const content = await getVersionContent(dirHandle, version);
            if (content !== null) {
                onRestore(content);
            }
        }
    }

    if (!dirHandle || !currentFile) {
        return (
            <div className="p-4 text-sm text-muted-foreground text-center border-2 border-dashed border-border rounded-lg bg-muted/30">
                Select a file to view history.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SidebarAPI.Header>
                <div className="flex items-center gap-2 mb-4 px-2">
                    <History className="w-5 h-5" />
                    <span className="font-bold text-lg">History</span>
                </div>
                <div className="flex flex-col gap-2 px-2">
                    <input
                        type="text"
                        placeholder="Commit message (optional)"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleCommit();
                            }
                        }}
                    />
                    <Button onClick={handleCommit} className="w-full justify-center" size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Commit Change
                    </Button>
                </div>
            </SidebarAPI.Header>

            <SidebarAPI.Group className="px-2">
                {loading ? (
                    <div className="text-center text-sm text-muted-foreground">Loading history...</div>
                ) : versions.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground">No versions saved yet.</div>
                ) : (
                    versions.map((version) => (
                        <div key={version.id} className="border rounded-lg p-3 text-sm space-y-2 bg-card mb-2 shadow-sm">
                            <div className="flex justify-between items-start">
                                <span className="font-medium text-xs text-muted-foreground">
                                    {new Date(version.timestamp).toLocaleString()}
                                </span>
                            </div>
                            {version.note && (
                                <p className="text-foreground">{version.note}</p>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-center text-xs h-7"
                                onClick={() => handleRestore(version)}
                            >
                                <RotateCcw className="w-3 h-3 mr-2" />
                                Restore
                            </Button>
                        </div>
                    ))
                )}
            </SidebarAPI.Group>
        </div>
    );
}
