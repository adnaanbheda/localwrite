import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { PluginProvider } from '../contexts/PluginContext';
import { WorkspaceProvider } from '../contexts/WorkspaceContext';
import * as storage from '../lib/storage';


// Mock storage
vi.mock('../lib/storage', async (importOriginal) => {
    const mockStorageImplementation = {
        loadDirectoryHandle: vi.fn(),
        scanDirectory: vi.fn(),
        readFile: vi.fn(),
        writeFile: vi.fn(),
        saveDirectoryHandle: vi.fn(),
        saveLastFile: vi.fn(),
        verifyPermission: vi.fn().mockResolvedValue(true),
        getDirectoryHandle: vi.fn(),
        loadLastFile: vi.fn(),
        getVersionHistoryEnabled: vi.fn().mockResolvedValue(false),
        saveVersion: vi.fn(),
        getVersions: vi.fn().mockResolvedValue([]),
    };

    return {
        ...await importOriginal<any>(),
        ...mockStorageImplementation,
    };
});

// Mock generic components
vi.mock('../components/Editor', () => ({ default: () => <div>Editor</div> }));
vi.mock('../components/Sidebar', () => ({ Sidebar: () => <div>Sidebar</div> }));

describe('App Stability', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('does NOT infinite loop on mount with active directory', async () => {
        // Setup a scenario where directory is loaded
        const mockHandle = { name: 'TestFolder', kind: 'directory' };
        (storage.loadDirectoryHandle as any).mockResolvedValue(mockHandle);
        (storage.scanDirectory as any).mockResolvedValue([]);

        render(
            <WorkspaceProvider initialId="test-workspace">
                <PluginProvider>
                    <App />
                </PluginProvider>
            </WorkspaceProvider>
        );

        // Wait for initial load
        await waitFor(() => expect(storage.loadDirectoryHandle).toHaveBeenCalled());

        // Wait a bit to see if it loops
        // In a real loop, these would be called hundreds of times rapidly
        // We'll verify they are called a reasonable number of times (e.g. 1-2)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Strictly, loadDirectoryHandle might be called once on mount.
        // scanDirectory might be called once after load.
        expect(storage.loadDirectoryHandle).toHaveBeenCalledTimes(1);

        // If the infinite loop was present (hook dependency issue), 
        // the effect dependent on `initFileSystem` or `openFile` would re-run,
        // causing repeated calls to storage methods if they were inside the loop.
        // For example, if scanDirectory is called in init, and init keeps re-running:
        expect(storage.scanDirectory).toBeCalledTimes(1);
    });
});
