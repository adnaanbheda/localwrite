// Simple IndexedDB wrapper since npm install failed
const DB_NAME = 'localwrite-db';
const STORE_NAME = 'keyval';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
    });
}

export async function set(key: string, value: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

export async function get(key: string): Promise<any> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    try {
        const handle = await window.showDirectoryPicker();
        return handle;
    } catch (error) {
        console.error("Error accessing directory:", error);
        return null;
    }
}

export async function verifyPermission(
    fileHandle: FileSystemHandle,
    readWrite: boolean
) {
    const options: FileSystemHandlePermissionDescriptor = {};
    if (readWrite) {
        options.mode = "readwrite";
    }
    if ((await fileHandle.queryPermission(options)) === "granted") {
        return true;
    }
    if ((await fileHandle.requestPermission(options)) === "granted") {
        return true;
    }
    return false;
}

export async function listFiles(
    directoryHandle: FileSystemDirectoryHandle
): Promise<FileSystemFileHandle[]> {
    const files: FileSystemFileHandle[] = [];
    for await (const entry of directoryHandle.values()) {
        if (entry.kind === "file" && entry.name.endsWith(".md")) {
            files.push(entry);
        }
    }
    return files;
}

export async function readFile(fileHandle: FileSystemFileHandle): Promise<string> {
    const file = await fileHandle.getFile();
    return await file.text();
}

export async function writeFile(
    fileHandle: FileSystemFileHandle,
    contents: string
): Promise<void> {
    // Create a writable stream to the file.
    const writable = await fileHandle.createWritable();
    // Write the contents.
    await writable.write(contents);
    // Close the file.
    await writable.close();
}

export async function saveDirectoryHandle(handle: FileSystemDirectoryHandle) {
    await set('localwrite-dir-handle', handle);
}

export async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | undefined> {
    return await get('localwrite-dir-handle');
}

export async function saveLastFile(fileName: string) {
    await set('localwrite-last-file', fileName);
}

export async function loadLastFile(): Promise<string | undefined> {
    return await get('localwrite-last-file');
}

// Version History

export interface Version {
    id: string;
    fileName: string;
    timestamp: number;
    note?: string;
    versionFile: string;
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
    note?: string
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
            versionFile: versionFileName
        };

        historyIndex.unshift(newVersion); // Add to beginning

        const indexHandle = await historyDir.getFileHandle('history.json', { create: true });
        const indexWritable = await indexHandle.createWritable();
        await indexWritable.write(JSON.stringify(historyIndex, null, 2));
        await indexWritable.close();

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
