import { useCallback, useState } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { FileSystemItem } from '../lib/storage';
import {
    getDirectoryHandle,
    loadDirectoryHandle,
    saveDirectoryHandle,
    scanDirectory,
    verifyPermission,
    writeFile
} from '../lib/storage';

export function useFileSystem() {
    const { workspaceId, updateWorkspaceId } = useWorkspace();
    const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
    const [folderName, setFolderName] = useState<string | null>(null);
    const [items, setItems] = useState<FileSystemItem[]>([]);

    const init = useCallback(async () => {
        if (!workspaceId) return [];

        const handle = await loadDirectoryHandle(workspaceId);
        if (handle) {
            if (await verifyPermission(handle, false)) {
                setDirHandle(handle);
                setFolderName(handle.name);
                const itemList = await scanDirectory(handle);
                setItems(itemList);
                return itemList;
            }
        }
        return [];
    }, [workspaceId]);

    const setFolder = useCallback(async () => {
        try {
            const handle = await getDirectoryHandle();
            if (handle) {
                let currentWorkspaceId = workspaceId;

                // If no workspace set, generate one from folder name and update context + URL
                if (!currentWorkspaceId) {
                    const slug = handle.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '') || handle.name;

                    // Update the workspace ID in context and URL
                    updateWorkspaceId(slug);
                    currentWorkspaceId = slug;
                }

                setDirHandle(handle);
                setFolderName(handle.name);
                await saveDirectoryHandle(handle, currentWorkspaceId);
                const itemList = await scanDirectory(handle);
                setItems(itemList);
                return handle;
            }
        } catch (e) {
            console.error('Error selecting folder:', e);
        }
        return null;
    }, [workspaceId, updateWorkspaceId]);

    const createFile = useCallback(async (name: string) => {
        if (!dirHandle) return null;
        const fileName = name.endsWith('.md') ? name : `${name}.md`;
        try {
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            await writeFile(fileHandle, "");
            const itemList = await scanDirectory(dirHandle);
            setItems(itemList);
            return fileHandle;
        } catch (e) {
            console.error('Error creating file:', e);
            return null;
        }
    }, [dirHandle]);

    return {
        dirHandle,
        folderName,
        items,
        init,
        setFolder,
        createFile
    };
}
