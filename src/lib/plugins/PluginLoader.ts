import { pluginManager } from './PluginManager';
import type { Plugin } from './types';

// Helper to normalize GitHub URLs to a CDN that serves ESM
// We'll use esm.sh for this MVP as it handles transforming commonjs/etc to ESM
// and can serve raw files from GitHub.
export function normalizePluginUrl(inputUrl: string): string {
    let url = inputUrl.trim();

    // If it's a bare GitHub repo URL, try to point to a reasonable default entry point via esm.sh
    // e.g. https://github.com/user/repo -> https://esm.sh/gh/user/repo/index.js
    if (url.startsWith('https://github.com/')) {
        const repoPath = url.replace('https://github.com/', '');
        // We'll assume the user wants the 'main' branch and 'dist/index.js' or 'mod.js'
        // For now, let's guide the user to paste a direct link or handle a specific convention.
        // Let's try to infer:
        return `https://esm.sh/gh/${repoPath}@main/dist/index.js`;
    }

    return url;
}

export async function loadPluginFromUrl(url: string): Promise<Plugin | null> {
    try {
        const normalizedUrl = normalizePluginUrl(url);

        // Dynamic import
        // Note: For this to work with React, the plugin needs to import React from a shared source
        // or we need an import map. For this MVP, we might encounter "Multiple Reacts" issues
        // if the plugin bundles React. Ideally, we use a SystemJS loader or Import Map.
        // But let's try standard ESM first.
        const module = await import(/* @vite-ignore */ normalizedUrl);

        // Assume default export is the Plugin object
        const plugin = module.default;

        if (!plugin || !plugin.id || !plugin.name) {
            throw new Error('Invalid plugin structure. Default export must be a Plugin object.');
        }

        return plugin as Plugin;

    } catch (error) {
        console.error(`Failed to load plugin from ${url}:`, error);
        throw error;
    }
}

const pluginUrlMap = new Map<string, string>();

export async function installPlugin(url: string) {
    const plugin = await loadPluginFromUrl(url);
    if (plugin) {
        pluginManager.register(plugin);
        pluginUrlMap.set(plugin.id, url);

        // Persist the URL so we can reload it next time
        const installedUrls = JSON.parse(localStorage.getItem('installed_plugin_urls') || '[]');
        if (!installedUrls.includes(url)) {
            installedUrls.push(url);
            localStorage.setItem('installed_plugin_urls', JSON.stringify(installedUrls));
        }
    }
    return plugin;
}

export async function restoreInstalledPlugins() {
    const installedUrls = JSON.parse(localStorage.getItem('installed_plugin_urls') || '[]');
    for (const url of installedUrls) {
        try {
            const plugin = await loadPluginFromUrl(url);
            if (plugin) {
                pluginManager.register(plugin);
                pluginUrlMap.set(plugin.id, url);
            }
        } catch (e) {
            console.error(`Failed to restore plugin from ${url}`, e);
        }
    }
}

export function uninstallPlugin(pluginId: string) {
    // 1. Unregister from manager
    pluginManager.unregister(pluginId);

    // 2. Remove from persistent storage
    const url = pluginUrlMap.get(pluginId);
    if (url) {
        const installedUrls = JSON.parse(localStorage.getItem('installed_plugin_urls') || '[]');
        const newInstalledUrls = installedUrls.filter((u: string) => u !== url);
        localStorage.setItem('installed_plugin_urls', JSON.stringify(newInstalledUrls));
        pluginUrlMap.delete(pluginId);
    }
}
