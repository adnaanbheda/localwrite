import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { pluginManager } from '../lib/plugins/PluginManager';
import { PluginProvider, usePlugin } from './PluginContext';

// Reset plugins
const mockPlugin = {
    id: 'ctx-test',
    name: 'Context Test',
    description: 'Testing Context'
};

pluginManager.register(mockPlugin);

const TestComponent = () => {
    const { enabledPlugins, enablePlugin, disablePlugin, isPluginEnabled } = usePlugin();

    return (
        <div>
            <span data-testid="enabled-list">{JSON.stringify(enabledPlugins)}</span>
            <button onClick={() => enablePlugin('ctx-test')}>Enable</button>
            <button onClick={() => disablePlugin('ctx-test')}>Disable</button>
            <span data-testid="is-enabled">{isPluginEnabled('ctx-test').toString()}</span>
        </div>
    );
};

describe('PluginContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('provides default state', () => {
        render(
            <PluginProvider>
                <TestComponent />
            </PluginProvider>
        );

        // Default is history enabled
        expect(screen.getByTestId('enabled-list')).toHaveTextContent('["history"]');
    });

    it('enables a plugin', async () => {
        render(
            <PluginProvider>
                <TestComponent />
            </PluginProvider>
        );

        const enableBtn = screen.getByText('Enable');
        await act(async () => {
            enableBtn.click();
        });

        expect(screen.getByTestId('is-enabled')).toHaveTextContent('true');
        expect(screen.getByTestId('enabled-list')).toContain('ctx-test');
    });

    it('disables a plugin', async () => {
        // Setup with it enabled
        localStorage.setItem('enabled_plugins', JSON.stringify(['history', 'ctx-test']));

        render(
            <PluginProvider>
                <TestComponent />
            </PluginProvider>
        );

        expect(screen.getByTestId('is-enabled')).toHaveTextContent('true');

        const disableBtn = screen.getByText('Disable');
        await act(async () => {
            disableBtn.click();
        });

        expect(screen.getByTestId('is-enabled')).toHaveTextContent('false');
    });
});
