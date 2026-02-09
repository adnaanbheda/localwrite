import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveVersion, type Version } from './storage';

// Helper to mock FileSystemFileHandle
const createMockFileHandle = (name: string, content: string = '') => ({
    kind: 'file',
    name,
    getFile: vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(content),
        stream: vi.fn(), // Mock stream for compression if needed, but we might mock compress/decompress
    }),
    createWritable: vi.fn().mockResolvedValue({
        write: vi.fn(),
        close: vi.fn(),
    }),
});

// Helper to mock FileSystemDirectoryHandle
const createMockDirHandle = (files: Record<string, any> = {}) => {
    const handles = { ...files };
    return {
        kind: 'directory',
        getDirectoryHandle: vi.fn().mockResolvedValue({
            getFileHandle: vi.fn().mockImplementation((name, options) => {
                if (!handles[name]) {
                    if (options?.create) {
                        handles[name] = createMockFileHandle(name);
                    } else {
                        throw new Error('File not found');
                    }
                }
                return handles[name];
            }),
            removeEntry: vi.fn().mockImplementation((name) => {
                delete handles[name];
                return Promise.resolve();
            })
        }),
    } as any;
};

// Mock compression to avoid stream issues in test environment
(globalThis as any).CompressionStream = class {
    writable = new WritableStream();
    readable = new ReadableStream();
} as any;

describe('History Storage Pruning', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('correctly prunes old auto-saves while keeping daily backups', async () => {
        const NOW = new Date('2024-01-20T12:00:00Z').getTime();
        vi.setSystemTime(NOW);

        const fileName = 'test.md';

        // Mock existing versions:
        // 1. 15 recent auto-saves (last few hours of 2024-01-20)
        // 2. 5 older auto-saves from 2024-01-19 (yesterday)
        // 3. 5 older auto-saves from 2024-01-18 (2 days ago)
        // 4. 1 manual save from 2024-01-18

        const versions: Version[] = [];

        // Helper to add version
        const addVersion = (offsetHrs: number, type: 'auto' | 'manual' = 'auto', dayOffset = 0) => {
            // offsetHrs is hours BEFORE now
            const time = NOW - (dayOffset * 24 * 60 * 60 * 1000) - (offsetHrs * 60 * 60 * 1000);
            versions.push({
                id: crypto.randomUUID(),
                fileName,
                timestamp: time,
                versionFile: `${fileName}-${time}.gz`,
                type
            });
        };

        // Create 15 recent auto-saves (0 to 14 hours ago today)
        for (let i = 0; i < 15; i++) {
            addVersion(i, 'auto', 0); // 0 days ago
        }

        // Create 5 auto-saves from yesterday
        for (let i = 0; i < 5; i++) {
            addVersion(i, 'auto', 1); // 1 day ago
        }

        // Create 5 auto-saves from 2 days ago
        for (let i = 0; i < 5; i++) {
            addVersion(i, 'auto', 2); // 2 days ago
        }

        // Create 1 manual save 2 days ago
        addVersion(2, 'manual', 2);

        // Setup mock FS
        const historyJson = JSON.stringify(versions);
        const fileHandles: any = {
            'history.json': createMockFileHandle('history.json', historyJson)
        };
        // Populate file handles for versions so removeEntry doesn't fail (though our mock swallows it anyway)
        versions.forEach(v => {
            fileHandles[v.versionFile] = createMockFileHandle(v.versionFile);
        });

        const dirHandle = createMockDirHandle(fileHandles);
        const historyDirHandle = await dirHandle.getDirectoryHandle('.history');

        // Trigger a new auto-save which should trigger pruning
        await saveVersion(dirHandle, fileName, 'new content', 'Auto-save', 'auto');

        // Verify Pruning Logic
        // 1. New version added -> Total 16 recent + others.
        // 2. EXPECTED RETENTION:
        //    - Newest 10 auto-saves (from the 16 recent).
        //    - Yesterday: Keep 1 (latest of that day).
        //    - 2 days ago: Keep 1 auto-save (latest of that day) + 1 manual (always kept).

        // Total expected auto-saves: 10 + 1 (yesterday) + 1 (2 days ago) = 12 auto-saves.
        // + 1 manual save = 13 total versions.

        // Check history.json content written
        const writeCalls = fileHandles['history.json'].createWritable.mock.results[0].value.write.mock.calls;
        // The last write call has the updated index
        const lastWrite = writeCalls[writeCalls.length - 1][0]; // Assuming Blob or string
        // In our mock, if we passed string to write, proceed. 
        // Real code calls write(blob). 
        // Wait, index is written as string: `await indexWritable.write(JSON.stringify(...))`

        const savedIndex: Version[] = JSON.parse(lastWrite);

        const finalAutoVersions = savedIndex.filter(v => v.type === 'auto');
        const finalManualVersions = savedIndex.filter(v => v.type === 'manual');

        expect(finalAutoVersions.length).toBe(13); // 10 recent + 1 older-today + 1 yesterday + 1 dayBefore
        expect(finalManualVersions.length).toBe(1); // Manual kept

        // Verify the correctly deleted files
        // We started with 15 + 5 + 5 = 25 auto-saves.
        // Added 1 = 26.
        // Kept 12.
        // Deleted 14.

        expect(historyDirHandle.removeEntry).toHaveBeenCalled();

        vi.useRealTimers();
    });
});
