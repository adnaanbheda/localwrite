import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDirectoryHandle, verifyPermission } from './storage';

describe('Storage OPFS Fallback', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset globals
        (globalThis as any).window = {};
        (globalThis as any).navigator = {};
    });

    describe('getDirectoryHandle', () => {
        it('uses showDirectoryPicker when available (Chrome/Edge)', async () => {
            const mockHandle = { kind: 'directory', name: 'test-dir' };
            window.showDirectoryPicker = vi.fn().mockResolvedValue(mockHandle);

            const result = await getDirectoryHandle();

            expect(window.showDirectoryPicker).toHaveBeenCalled();
            expect(result).toBe(mockHandle);
        });

        it('falls back to navigator.storage.getDirectory when showDirectoryPicker is missing (Safari)', async () => {
            const mockHandle = { kind: 'directory', name: 'opfs-root' };

            // @ts-ignore
            delete window.showDirectoryPicker;

            (globalThis as any).navigator.storage = {
                getDirectory: vi.fn().mockResolvedValue(mockHandle)
            };

            const result = await getDirectoryHandle();

            expect(navigator.storage.getDirectory).toHaveBeenCalled();
            expect(result).toBe(mockHandle);
        });

        it('returns null and logs error if no API is available', async () => {
            // @ts-ignore
            delete window.showDirectoryPicker;
            (globalThis as any).navigator.storage = {};

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const result = await getDirectoryHandle();

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("not supported"));

            consoleSpy.mockRestore();
        });

        it('returns null on AbortError (user cancelled picker)', async () => {
            window.showDirectoryPicker = vi.fn().mockRejectedValue({ name: 'AbortError' });

            const result = await getDirectoryHandle();

            expect(result).toBeNull();
        });
    });

    describe('verifyPermission', () => {
        it('returns true for OPFS handles that do not support permission API', async () => {
            const mockOpfsHandle = { kind: 'directory', name: 'opfs' }; // No queryPermission method

            const result = await verifyPermission(mockOpfsHandle as any, true);

            expect(result).toBe(true);
        });

        it('calls queryPermission and returns true if granted', async () => {
            const mockHandle = {
                kind: 'directory',
                queryPermission: vi.fn().mockResolvedValue('granted'),
                requestPermission: vi.fn()
            };

            const result = await verifyPermission(mockHandle as any, true);

            expect(mockHandle.queryPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
            expect(result).toBe(true);
        });

        it('calls requestPermission if queryPermission is not granted', async () => {
            const mockHandle = {
                kind: 'directory',
                queryPermission: vi.fn().mockResolvedValue('prompt'),
                requestPermission: vi.fn().mockResolvedValue('granted')
            };

            const result = await verifyPermission(mockHandle as any, true);

            expect(mockHandle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
            expect(result).toBe(true);
        });

        it('returns true if permission API throws (fallback safety)', async () => {
            const mockHandle = {
                kind: 'directory',
                queryPermission: vi.fn().mockRejectedValue(new Error('API failed')),
            };

            const result = await verifyPermission(mockHandle as any, true);

            expect(result).toBe(true);
        });
    });
});
