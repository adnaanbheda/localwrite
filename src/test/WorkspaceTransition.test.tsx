import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { PluginProvider } from '../contexts/PluginContext';
import { WorkspaceProvider } from '../contexts/WorkspaceContext';
import * as storage from '../lib/storage';
import { createMockFileHandle } from './utils';

// Mock storage module entirely
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
        saveVersion: vi.fn(),
        getVersions: vi.fn().mockResolvedValue([]),
    };

    return {
        ...await importOriginal<any>(),
        ...mockStorageImplementation,
    };
});

// Mock Editor to inspect content
vi.mock('../components/Editor', () => ({
    default: ({ value, onChange, ...props }: any) => {
        const textContent = value.map((n: any) => n.children[0].text).join('\n');
        return (
            <div data-testid="mock-editor" data-key={props.key}>
                <div data-testid="editor-content">{textContent}</div>
            </div>
        );
    }
}));

// Mock FileExplorer to interact with files
vi.mock('../components/FileExplorer', () => ({
    FileExplorer: ({ items, onSelectFile }: any) => (
        <div data-testid="file-explorer">
            {items.map((item: any) => (
                <button key={item.name} onClick={() => onSelectFile(item.handle)}>
                    {item.name}
                </button>
            ))}
        </div>
    )
}));

// Mock Settings to trigger folder selection
vi.mock('../components/Settings', () => ({
    Settings: ({ onSetFolder }: any) => (
        <button data-testid="set-folder-btn" onClick={onSetFolder}>
            Set Folder
        </button>
    )
}));

// Mock other components to reduce noise
vi.mock('../components/retroui/TableOfContents', () => ({ TableOfContents: () => <div /> }));

describe('Workspace Transition', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset URL
        window.history.replaceState(null, '', '/');
    });

    it('updates URL and clears editor when changing folders', async () => {
        const folder1Handle = {
            name: 'Folder1',
            kind: 'directory',
            getFileHandle: vi.fn(),
            values: vi.fn(),
        };

        const folder2Handle = {
            name: 'Folder2',
            kind: 'directory',
            getFileHandle: vi.fn(),
            values: vi.fn(),
        };

        const file1Handle = createMockFileHandle('file1.md', 'Content of File 1');

        // Setup storage mocks
        (storage.getDirectoryHandle as any)
            .mockResolvedValueOnce(folder1Handle)
            .mockResolvedValueOnce(folder2Handle);

        (storage.scanDirectory as any)
            .mockResolvedValueOnce([{ name: 'file1.md', kind: 'file', handle: file1Handle }]) // For folder 1
            .mockResolvedValueOnce([]); // For folder 2

        (storage.readFile as any).mockResolvedValue('Content of File 1');

        render(
            <WorkspaceProvider>
                <PluginProvider>
                    <App />
                </PluginProvider>
            </WorkspaceProvider>
        );

        // 1. Initially no folder, show prompt
        expect(screen.getByText(/Select a folder/i)).toBeInTheDocument();

        // 2. Select Folder 1
        const setFolderBtn = screen.getByTestId('set-folder-btn');
        await act(async () => {
            setFolderBtn.click();
        });

        // Verify URL updated to ?ws=folder1
        await waitFor(() => {
            expect(window.location.search).toContain('ws=folder1');
        });

        // Open file1.md
        await waitFor(() => screen.getByTestId('file-explorer'));
        const fileBtn = screen.getByText('file1.md');
        await act(async () => {
            fileBtn.click();
        });

        // Verify editor has content and URL has file=file1.md
        await waitFor(() => {
            expect(screen.getByTestId('editor-content')).toHaveTextContent('Content of File 1');
            expect(window.location.search).toContain('file=file1.md');
        });

        // 3. Select Folder 2
        await act(async () => {
            setFolderBtn.click();
        });

        // Verify URL updated to ?ws=folder2 AND file param is removed
        await waitFor(() => {
            expect(window.location.search).toContain('ws=folder2');
            expect(window.location.search).not.toContain('file=file1.md');
        });

        // Verify editor is cleared
        expect(screen.getByTestId('editor-content')).toHaveTextContent('');
    });
});
