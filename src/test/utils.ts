import { vi } from 'vitest';

export const createMockFileHandle = (name: string, content = '') => ({
    name,
    kind: 'file' as const,
    createWritable: vi.fn().mockResolvedValue({
        write: vi.fn(),
        close: vi.fn(),
    }),
    getFile: vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(content),
    })
});


