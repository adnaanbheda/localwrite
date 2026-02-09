import { useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { FileSystemItem } from '../lib/storage';
import { findFileByName, loadLastFile } from '../lib/storage';

export function useFileRestoration(
    initFileSystem: () => Promise<FileSystemItem[]>,
    openFile: (file: FileSystemFileHandle) => Promise<void>
) {
    const { workspaceId } = useWorkspace();

    useEffect(() => {
        async function init() {
            if (!workspaceId) return;

            const loadedItems = await initFileSystem();

            // Try to restore last file
            const params = new URLSearchParams(window.location.search);
            const fileParam = params.get('file');
            const lastFileName = await loadLastFile(workspaceId);
            const fileToOpenName = fileParam || lastFileName;

            if (fileToOpenName && loadedItems.length > 0) {
                const fileToRestore = findFileByName(loadedItems, fileToOpenName);
                if (fileToRestore) {
                    await openFile(fileToRestore);
                }
            }
        }
        init();
    }, [initFileSystem, openFile, workspaceId]);
}
