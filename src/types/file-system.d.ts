export { };

declare global {
    interface Window {
        showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
    }

    interface FileSystemHandle {
        kind: 'file' | 'directory';
        name: string;
        isSameEntry(other: FileSystemHandle): Promise<boolean>;
        queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
        requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    }

    interface FileSystemDirectoryHandle extends FileSystemHandle {
        kind: 'directory';
        values(): AsyncIterableIterator<FileSystemDirectoryHandle | FileSystemFileHandle>;
        keys(): AsyncIterableIterator<string>;
        entries(): AsyncIterableIterator<[string, FileSystemDirectoryHandle | FileSystemFileHandle]>;
        getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>;
        getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions): Promise<FileSystemDirectoryHandle>;
        removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>;
        resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
    }

    interface FileSystemFileHandle extends FileSystemHandle {
        kind: 'file';
        getFile(): Promise<File>;
        createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
    }

    interface FileSystemWritableFileStream extends WritableStream {
        write(data: BufferSource | Blob | string | WriteParams): Promise<void>;
        seek(position: number): Promise<void>;
        truncate(size: number): Promise<void>;
    }

    interface FileSystemHandlePermissionDescriptor {
        mode?: 'read' | 'readwrite';
    }

    interface FileSystemGetFileOptions {
        create?: boolean;
    }

    interface FileSystemGetDirectoryOptions {
        create?: boolean;
    }

    interface FileSystemRemoveOptions {
        recursive?: boolean;
    }

    interface FileSystemCreateWritableOptions {
        keepExistingData?: boolean;
    }

    type WriteParams =
        | { type: 'write'; position?: number; data: BufferSource | Blob | string }
        | { type: 'seek'; position: number }
        | { type: 'truncate'; size: number };
}
