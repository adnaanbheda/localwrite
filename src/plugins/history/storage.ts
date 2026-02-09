import { get, set } from '@/lib/storage';

export interface Version {
    id: string;
    fileName: string;
    timestamp: number;
    note?: string;
    versionFile: string;
    type?: 'manual' | 'auto';
}

export async function getVersionHistoryEnabled(): Promise<boolean> {
    const val = await get('localwrite-history-enabled');
    return val === true; // Default to false if undefined, or change to val !== false for true default
}

export async function setVersionHistoryEnabled(enabled: boolean): Promise<void> {
    await set('localwrite-history-enabled', enabled);
}

async function compress(content: string): Promise<Blob> {
    const stream = new Blob([content]).stream();
    const compressedReadableStream = stream.pipeThrough(new CompressionStream("gzip"));
    return await new Response(compressedReadableStream).blob();
}

async function decompress(blob: Blob): Promise<string> {
    const stream = blob.stream();
    const decompressedReadableStream = stream.pipeThrough(new DecompressionStream("gzip"));
    return await new Response(decompressedReadableStream).text();
}

export async function saveVersion(
    dirHandle: FileSystemDirectoryHandle,
    fileName: string,
    content: string,
    note?: string,
    type: 'manual' | 'auto' = 'manual'
): Promise<void> {
    try {
        const historyDir = await dirHandle.getDirectoryHandle('.history', { create: true });

        // 1. Save compressed file
        const timestamp = Date.now();
        const versionFileName = `${fileName}-${timestamp}.gz`;
        const fileHandle = await historyDir.getFileHandle(versionFileName, { create: true });
        const compressedBlob = await compress(content);

        const writable = await fileHandle.createWritable();
        await writable.write(compressedBlob);
        await writable.close();

        // 2. Update index
        let historyIndex: Version[] = [];
        try {
            const indexHandle = await historyDir.getFileHandle('history.json'); // No create true yet
            const indexFile = await indexHandle.getFile();
            const text = await indexFile.text();
            historyIndex = JSON.parse(text);
        } catch (e) {
            // Index doesn't exist or is invalid, start empty
        }

        const newVersion: Version = {
            id: crypto.randomUUID(),
            fileName,
            timestamp,
            note,
            versionFile: versionFileName,
            type
        };

        historyIndex.unshift(newVersion); // Add to beginning

        const indexHandle = await historyDir.getFileHandle('history.json', { create: true });
        const indexWritable = await indexHandle.createWritable();
        await indexWritable.write(JSON.stringify(historyIndex, null, 2));
        await indexWritable.close();

        // 3. Prune if auto-save
        if (type === 'auto') {
            await pruneHistory(dirHandle, fileName);
        }

    } catch (error) {
        console.error("Failed to save version:", error);
    }
}

export async function getVersions(
    dirHandle: FileSystemDirectoryHandle,
    fileName: string
): Promise<Version[]> {
    try {
        const historyDir = await dirHandle.getDirectoryHandle('.history');
        const indexHandle = await historyDir.getFileHandle('history.json');
        const indexFile = await indexHandle.getFile();
        const text = await indexFile.text();
        const allVersions: Version[] = JSON.parse(text);

        return allVersions.filter(v => v.fileName === fileName);
    } catch (error) {
        // console.warn("No history found for", fileName);
        return [];
    }
}

export async function getVersionContent(
    dirHandle: FileSystemDirectoryHandle,
    version: Version
): Promise<string | null> {
    try {
        const historyDir = await dirHandle.getDirectoryHandle('.history');
        const fileHandle = await historyDir.getFileHandle(version.versionFile);
        const file = await fileHandle.getFile();
        return await decompress(file);
    } catch (error) {
        console.error("Failed to load version content:", error);
        return null;
    }
}

async function pruneHistory(dirHandle: FileSystemDirectoryHandle, fileName: string) {
    try {
        const historyDir = await dirHandle.getDirectoryHandle('.history');
        const indexHandle = await historyDir.getFileHandle('history.json');
        const indexFile = await indexHandle.getFile();
        const text = await indexFile.text();
        let allVersions: Version[] = JSON.parse(text);

        // Filter for this file and separate manual vs auto
        const fileVersions = allVersions.filter(v => v.fileName === fileName);
        const otherVersions = allVersions.filter(v => v.fileName !== fileName);

        const manualVersions = fileVersions.filter(v => v.type !== 'auto');
        const autoVersions = fileVersions.filter(v => v.type === 'auto');

        // Sort auto versions newest first (should already be, but ensure)
        autoVersions.sort((a, b) => b.timestamp - a.timestamp);

        // Retention Policy:
        // 1. Keep last 10 (Recent Pool)
        const recentPool = autoVersions.slice(0, 10);
        const olderPool = autoVersions.slice(10);

        // 2. Keep 1 per day for last 10 days (Daily Pool)
        const dailyPool: Version[] = [];
        const seenDays = new Set<string>();
        const now = new Date();
        const tenDaysAgo = new Date(now.setDate(now.getDate() - 10)).getTime();

        for (const v of olderPool) {
            if (v.timestamp < tenDaysAgo) continue; // Too old

            const day = new Date(v.timestamp).toISOString().split('T')[0];
            if (!seenDays.has(day)) {
                dailyPool.push(v);
                seenDays.add(day);
            }
        }

        // 3. Combine kept versions
        const keptAutoVersions = [...recentPool, ...dailyPool];
        const versionsToDelete = autoVersions.filter(v => !keptAutoVersions.includes(v));

        if (versionsToDelete.length === 0) return;

        // 4. Delete files
        for (const v of versionsToDelete) {
            try {
                await historyDir.removeEntry(v.versionFile);
            } catch (ignore) {
                // File might be missing
            }
        }

        // 5. Update Index
        const newIndex = [...otherVersions, ...manualVersions, ...keptAutoVersions];
        // Sort entire index by timestamp desc for UI
        newIndex.sort((a, b) => b.timestamp - a.timestamp);

        const indexWritable = await indexHandle.createWritable();
        await indexWritable.write(JSON.stringify(newIndex, null, 2));
        await indexWritable.close();

    } catch (error) {
        console.error("Pruning failed:", error);
    }
}
