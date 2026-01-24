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
