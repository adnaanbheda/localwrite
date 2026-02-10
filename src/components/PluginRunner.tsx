import { useEffect, useMemo, useRef } from 'react';
import { usePlugin } from '../contexts/PluginContext';
import { restoreInstalledPlugins } from '../lib/plugins/PluginLoader';
import type { Plugin, PluginContext } from '../lib/plugins/types';
import { ErrorBoundary } from './ErrorBoundary';

const PluginInstance = ({ plugin, context }: { plugin: Plugin, context: PluginContext }) => {
    const { getPluginSetting, setPluginSetting } = usePlugin();

    // Track keys set by this specific plugin instance for auto-cleanup
    const setKeysRef = useRef<string[]>([]);
    const stylesheetsRef = useRef<string[]>([]);

    // Create a scoped context for this plugin
    const scopedContext = useMemo(() => ({
        ...context,
        setThemeVars: (vars: Record<string, string>) => {
            const keys = Object.keys(vars);
            setKeysRef.current.push(...keys);
            context.setThemeVars(vars);
        },
        loadStylesheet: (url: string) => {
            stylesheetsRef.current.push(url);
            context.loadStylesheet(url);
        },
        getSetting: (key: string) => getPluginSetting(plugin.id, key),
        setSetting: (key: string, value: string) => setPluginSetting(plugin.id, key, value),
        prompt: async (msg: string, def?: string) => window.prompt(msg, def)
    }), [context, plugin.id, getPluginSetting, setPluginSetting]);

    useEffect(() => {
        let isInitialized = false;
        // Initialize
        if (plugin.initialize) {
            try {
                plugin.initialize(scopedContext);
                isInitialized = true;
            } catch (e) {
                console.error(`Failed to initialize plugin ${plugin.id}:`, e);
            }
        }

        // Cleanup / Destroy
        return () => {
            // Auto-cleanup theme vars
            if (setKeysRef.current.length > 0) {
                context.unsetThemeVars([...setKeysRef.current]);
                setKeysRef.current = [];
            }
            // Auto-cleanup stylesheets
            if (stylesheetsRef.current.length > 0) {
                stylesheetsRef.current.forEach(url => context.removeStylesheet(url));
                stylesheetsRef.current = [];
            }

            if (isInitialized && plugin.destroy) {
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
    const {
        plugins,
        enabledPlugins,
        setThemeVars,
        unsetThemeVars,
        loadStylesheet,
        removeStylesheet
    } = usePlugin();

    // Restore external plugins on mount
    useEffect(() => {
        restoreInstalledPlugins();
    }, []);

    // Stabilize context to prevent unnecessary re-initializations
    // These are the "raw" methods that handle the actual side effects
    const context: PluginContext = useMemo(() => ({
        setThemeVars,
        unsetThemeVars,
        loadStylesheet,
        removeStylesheet,
        // Dummies for scoped methods
        getSetting: () => null,
        setSetting: () => { },
        prompt: async (msg, def) => window.prompt(msg, def)
    }), [setThemeVars, unsetThemeVars, loadStylesheet, removeStylesheet]);

    return (
        <>
            {plugins.map(plugin => (
                enabledPlugins.includes(plugin.id) && (
                    <ErrorBoundary key={plugin.id} name={`Plugin:${plugin.name}`}>
                        <PluginInstance
                            plugin={plugin}
                            context={context}
                        />
                    </ErrorBoundary>
                )
            ))}
        </>
    );
}
