import { pluginManager } from './PluginManager';
import type { Plugin } from './types';

// Helper to normalize GitHub URLs to a CDN that serves ESM
// We'll use esm.sh for this MVP as it handles transforming commonjs/etc to ESM
// and can serve raw files from GitHub.
export function normalizePluginUrl(inputUrl: string): string {
    let url = inputUrl.trim();

    // 1. Handle "Raw" URLs (direct links to .js files on GitHub/Gist)
    // These need domain swap to githack.com for CORS and Content-Type: application/javascript
    if (url.includes('raw.githubusercontent.com') || url.includes('gist.githubusercontent.com')) {
        return url.replace('raw.githubusercontent.com', 'raw.githack.com')
            .replace('gist.githubusercontent.com', 'gist.githack.com');
    }

    // 2. Handle Gist "Home" URLs (https://gist.github.com/user/id)
    if (url.includes('gist.github.com')) {
        // Convert to githack raw URL. Githack for Gists: https://gist.githack.com/[user]/[id]/raw/
        // Note: Trailing slash is important for githack to guess the entry file if there's only one.
        url = url.replace('gist.github.com', 'gist.githack.com');
        if (!url.endsWith('/')) url += '/';
        if (!url.includes('/raw')) url += 'raw/';
        return url;
    }

    // 3. Handle GitHub Repo "Home" URLs (https://github.com/user/repo)
    if (url.startsWith('https://github.com/')) {
        const repoPath = url.replace('https://github.com/', '');
        // Route through esm.sh for ESM transformation and CORS headers
        // esm.sh handles finding index.js/main/etc for you.
        return `https://esm.sh/gh/${repoPath}`;
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
    // Check if URL is already installed to avoid redundant loads
    const installedUrls = JSON.parse(localStorage.getItem('installed_plugin_urls') || '[]');
    if (installedUrls.includes(url)) {
        console.warn(`Plugin from ${url} is already installed.`);
        return null;
    }

    const plugin = await loadPluginFromUrl(url);
    if (plugin) {
        // Double check against ID in case different URLs point to same plugin ID
        if (pluginManager.getPlugins().some(p => p.id === plugin.id)) {
            console.warn(`Plugin with ID ${plugin.id} is already registered.`);
            return plugin;
        }

        pluginManager.register(plugin);
        pluginUrlMap.set(plugin.id, url);

        // Persist the URL so we can reload it next time
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
