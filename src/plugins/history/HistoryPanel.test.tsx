import { serialize } from '@/lib/markdown';
import { getVersionContent, getVersions, saveVersion } from '@/lib/storage';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { HistoryPanel } from './HistoryPanel';

// Mocks
vi.mock('@/lib/storage');
vi.mock('@/lib/markdown');
vi.mock('@/components/retroui/Button', () => ({
    Button: ({ children, onClick, ...props }: any) => (
        <button onClick={onClick} {...props}>{children}</button>
    ),
}));
vi.mock('@/components/SidebarAPI', () => ({
    SidebarAPI: {
        Header: ({ children }: any) => <div data-testid="sidebar-header">{children}</div>,
        Group: ({ children }: any) => <div data-testid="sidebar-group">{children}</div>,
    }
}));

describe('HistoryPanel', () => {
    const mockDirHandle = {} as FileSystemDirectoryHandle;
    const mockCurrentFile = { name: 'test.md' } as FileSystemFileHandle;
    const mockEditorContent = [{ type: 'paragraph', children: [{ text: 'content' }] }] as any;
    const mockOnRestore = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (getVersions as Mock).mockResolvedValue([]);
    });

    it('renders placeholder when no file is selected', () => {
        render(<HistoryPanel dirHandle={null} currentFile={null} editorContent={[]} onRestore={mockOnRestore} />);
        expect(screen.getByText('Select a file to view history.')).toBeInTheDocument();
    });

    it('loads and displays versions', async () => {
        const mockVersions = [
            { id: '1', timestamp: Date.now(), note: 'Initial commit' }
        ];
        (getVersions as Mock).mockResolvedValue(mockVersions);

        render(<HistoryPanel dirHandle={mockDirHandle} currentFile={mockCurrentFile} editorContent={mockEditorContent} onRestore={mockOnRestore} />);

        expect(screen.getByText('Loading history...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Initial commit')).toBeInTheDocument();
        });
    });

    it('handles committing a new version', async () => {
        (serialize as Mock).mockReturnValue('serialized content');

        render(<HistoryPanel dirHandle={mockDirHandle} currentFile={mockCurrentFile} editorContent={mockEditorContent} onRestore={mockOnRestore} />);

        const input = screen.getByPlaceholderText('Commit message (optional)');
        fireEvent.change(input, { target: { value: 'New version' } });

        const commitBtn = screen.getByText('Commit Change');
        fireEvent.click(commitBtn);

        await waitFor(() => {
            expect(saveVersion).toHaveBeenCalledWith(mockDirHandle, 'test.md', 'serialized content', 'New version');
        });
        expect(getVersions).toHaveBeenCalledTimes(2); // Initial load + after commit
    });

    it('handles restoring a version', async () => {
        const mockVersions = [
            { id: '1', timestamp: Date.now(), note: 'Version 1' }
        ];
        (getVersions as Mock).mockResolvedValue(mockVersions);
        (getVersionContent as Mock).mockResolvedValue('restored content');

        // Mock confirm
        window.confirm = vi.fn(() => true);

        render(<HistoryPanel dirHandle={mockDirHandle} currentFile={mockCurrentFile} editorContent={mockEditorContent} onRestore={mockOnRestore} />);

        await waitFor(() => {
            expect(screen.getByText('Version 1')).toBeInTheDocument();
        });

        const restoreBtn = screen.getByText('Restore');
        fireEvent.click(restoreBtn);

        await waitFor(() => {
            expect(getVersionContent).toHaveBeenCalledWith(mockDirHandle, mockVersions[0]);
            expect(mockOnRestore).toHaveBeenCalledWith('restored content');
        });
    });
});
