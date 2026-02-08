import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { PluginProvider } from './contexts/PluginContext';
import * as storage from './lib/storage';

// Mock storage module entirely
vi.mock('./lib/storage', async (importOriginal) => {
    return {
        ...await importOriginal<any>(),
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
});

// Mock Editor to inspect content
// We need to forward refs if used, but App.tsx doesn't ref Editor directly?
// App.tsx passes key, value, onChange
vi.mock('./components/Editor', () => ({
    default: ({ value, onChange, ...props }: any) => {
        // Render simple text representation
        console.log('[MockEditor] Render with key:', props.key);
        const textContent = value.map((n: any) => n.children[0].text).join('\n');
        console.log('[MockEditor] Content:', textContent);
        return (
            <div data-testid="mock-editor" data-key={props.key}>
                <div data-testid="editor-content">{textContent}</div>
                <button data-testid="type-content" onClick={() => onChange([{ type: 'paragraph', children: [{ text: 'New content typed' }] }])}>
                    Type
                </button>
            </div>
        );
    }
}));

// Mock FileExplorer for easier interaction
vi.mock('./components/FileExplorer', () => ({
    FileExplorer: ({ items, onSelectFile, onCreateFile }: any) => (
        <div data-testid="file-explorer">
            {items.map((item: any) => (
                <button key={item.name} onClick={() => onSelectFile(item.handle)}>
                    {item.name}
                </button>
            ))}
            <button onClick={onCreateFile}>New File</button>
        </div>
    )
}));

// Mock other components to reduce noise
vi.mock('./components/retroui/TableOfContents', () => ({ TableOfContents: () => <div /> }));
vi.mock('./components/Settings', () => ({ Settings: () => <div /> }));

// Helper to create handles
const createMockFileHandle = (name: string, content = '') => ({
    name,
    kind: 'file',
    createWritable: vi.fn().mockResolvedValue({
        write: vi.fn(),
        close: vi.fn(),
    }),
    getFile: vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(content),
    })
});

describe('App Integration', () => {
    vi.clearAllMocks();

    const mockDirHandle = {
        name: 'TestFolder',
        kind: 'directory',
        getFileHandle: vi.fn().mockImplementation(async (name) => createMockFileHandle(name, '')),
        getDirectoryHandle: vi.fn().mockResolvedValue({
            getFileHandle: vi.fn().mockResolvedValue(createMockFileHandle('history.json', '[]')),
        }),
        values: vi.fn(),
    };

    // Setup initial storage state
    (storage.loadDirectoryHandle as any).mockResolvedValue(mockDirHandle);
    (storage.getDirectoryHandle as any).mockResolvedValue(mockDirHandle);

    // Initial scan returns one file
    (storage.scanDirectory as any).mockResolvedValue([
        { name: 'existing.md', kind: 'file', handle: createMockFileHandle('existing.md', 'Existing Content') }
    ]);
    (storage.readFile as any).mockResolvedValue('Existing Content');
    vi.spyOn(window, 'prompt').mockImplementation(() => 'new-file');

    it('loads and displays files', async () => {
        render(
            <PluginProvider>
                <App />
            </PluginProvider>
        );

        await waitFor(() => screen.getAllByTestId('file-explorer')[0]);
        expect(screen.getAllByText('existing.md')[0]).toBeInTheDocument();
    });

    it('opens a file and shows content', async () => {
        render(
            <PluginProvider>
                <App />
            </PluginProvider>
        );

        await waitFor(() => screen.getAllByTestId('file-explorer')[0]);

        const fileBtn = screen.getAllByText('existing.md')[0];
        await act(async () => {
            fileBtn.click();
        });

        await waitFor(() => {
            expect(screen.getAllByTestId('editor-content')[0]).toHaveTextContent('Existing Content');
        });
    });

    it('creates a new file and SHOWS EMPTY content (Bug Repro)', async () => {
        render(
            <PluginProvider>
                <App />
            </PluginProvider>
        );

        // 1. Open existing file first
        await waitFor(() => screen.getAllByTestId('file-explorer')[0]);
        await act(async () => {
            screen.getAllByText('existing.md')[0].click();
        });
        await waitFor(() => expect(screen.getAllByTestId('editor-content')[0]).toHaveTextContent('Existing Content'));

        // 2. Create new file
        // Mock scanDirectory to return BOTH files now
        (storage.scanDirectory as any).mockResolvedValue([
            { name: 'existing.md', kind: 'file', handle: createMockFileHandle('existing.md', 'Existing Content') },
            // new file handle
            { name: 'new-file.md', kind: 'file', handle: createMockFileHandle('new-file.md', '') }
        ]);

        // Mock readFile to return empty string for new file
        (storage.readFile as any).mockImplementation((handle: any) => {
            if (handle.name === 'new-file.md') return '';
            return 'Existing Content';
        });

        const newFileBtn = screen.getAllByText('New File')[0];
        await act(async () => {
            newFileBtn.click();
        });

        // 3. Verify editor shows empty content
        await waitFor(() => {
            // If bug exists, this might show 'Existing Content'
            const content = screen.getByTestId('editor-content').textContent;
            expect(content).toBe('');
        });

        // Also verify URL updated (optional but good)
        expect(window.location.search).toContain('new-file.md');
    });
});
