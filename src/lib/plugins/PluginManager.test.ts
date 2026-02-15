import { describe, expect, it, vi } from 'vitest';
import { pluginManager } from './PluginManager';
import type { Plugin } from './types';

describe('PluginManager', () => {
    // Reset singleton state if possible, or just be careful with IDs
    // Since it's a singleton exported instance, state persists. 
    // Ideally we'd be able to clear it, but for now we use unique IDs.

    it('registers a plugin successfully', () => {
        const plugin: Plugin = {
            id: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            description: 'A test plugin'
        };

        pluginManager.register(plugin);

        const retrieved = pluginManager.getPlugin('test-plugin');
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Test Plugin');
    });

    it('prevents duplicate registration', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        const plugin: Plugin = {
            id: 'duplicate-plugin',
            name: 'Duplicate',
            version: '1.0.0',
            description: ''
        };

        pluginManager.register(plugin);
        pluginManager.register(plugin);

        expect(consoleSpy).toHaveBeenCalled();
        expect(pluginManager.getPlugins().filter(p => p.id === 'duplicate-plugin').length).toBe(1);

        consoleSpy.mockRestore();
    });
});
