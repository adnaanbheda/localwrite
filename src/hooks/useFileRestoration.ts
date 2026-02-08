import { useEffect } from 'react';
import type { FileSystemItem } from '../lib/storage';
import { findFileByName, loadLastFile } from '../lib/storage';

export function useFileRestoration(
    initFileSystem: () => Promise<FileSystemItem[]>,
    openFile: (file: FileSystemFileHandle) => Promise<void>
) {
    useEffect(() => {
        async function init() {
            const loadedItems = await initFileSystem();

            // Try to restore last file
            const params = new URLSearchParams(window.location.search);
            const fileParam = params.get('file');
            const lastFileName = await loadLastFile();
            const fileToOpenName = fileParam || lastFileName;

            if (fileToOpenName && loadedItems.length > 0) {
                const fileToRestore = findFileByName(loadedItems, fileToOpenName);
                if (fileToRestore) {
                    await openFile(fileToRestore);
                }
            }
        }
        init();
    }, [initFileSystem, openFile]);
}
