import { useEffect, useMemo, useRef } from 'react';
import { usePlugin } from '../contexts/PluginContext';
import { restoreInstalledPlugins } from '../lib/plugins/PluginLoader';
import type { Plugin, PluginContext } from '../lib/plugins/types';

// Individual Plugin Wrapper to handle Lifecycle (Init/Destroy)
const PluginInstance = ({ plugin, context }: { plugin: Plugin, context: PluginContext }) => {
    // Track keys set by this specific plugin instance
    const setKeysRef = useRef<string[]>([]);

    // Create a scoped context for this plugin
    const scopedContext = useMemo(() => ({
        ...context,
        setThemeVars: (vars: Record<string, string>) => {
            const keys = Object.keys(vars);
            setKeysRef.current.push(...keys);
            context.setThemeVars(vars);
        }
    }), [context]);

    useEffect(() => {
        // Initialize
        if (plugin.initialize) {
            try {
                plugin.initialize(scopedContext);
            } catch (e) {
                console.error(`Failed to initialize plugin ${plugin.id}:`, e);
            }
        }

        // Cleanup / Destroy
        return () => {
            // Auto-cleanup theme vars
            if (setKeysRef.current.length > 0) {
                context.unsetThemeVars(setKeysRef.current);
            }

            if (plugin.destroy) {
                try {
                    plugin.destroy(scopedContext);
                } catch (e) {
                    console.error(`Failed to destroy plugin ${plugin.id}:`, e);
                }
            }
        };
    }, [plugin, scopedContext, context]);

    return null;
};

export function PluginRunner() {
    const { plugins, enabledPlugins, setThemeVars, unsetThemeVars } = usePlugin();
    // const { dirHandle, items, folderName } = useFileSystem();
    // const { editorContent, currentFile, handleRestoreVersion } = useEditor();

    // 1. Restore external plugins on mount
    useEffect(() => {
        restoreInstalledPlugins();
    }, []);

    // Stabilize context to prevent unnecessary re-initializations
    // Ideally we use useMemo, but dependencies like 'items' change often.
    // For now, let's pass a fresh object but PluginInstance only depends on what it uses?
    // Actually, if we pass a new object every time, useEffect triggers every render.
    // We need a stable context object or useRef.
    // However, plugins MIGHT need fresh state.
    // "Headless" plugins usually subscribe to events or global state, 
    // or we provide getters.
    // For this MVP, let's provide a proxy or just the setters which are stable.
    const context: PluginContext = {
        setThemeVars,
        unsetThemeVars,
    };

    return (
        <>
            {plugins.map(plugin => (
                enabledPlugins.includes(plugin.id) && (
                    <PluginInstance
                        key={plugin.id}
                        plugin={plugin}
                        context={context}
                    />
                )
            ))}
        </>
    );
}
