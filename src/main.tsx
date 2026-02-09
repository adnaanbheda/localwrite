import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from "./components/ThemeProvider"
import './index.css'
import { pluginManager } from './lib/plugins/PluginManager'
import { historyPlugin } from './plugins/history'

// Register default plugins
pluginManager.register(historyPlugin);

import { PluginProvider } from './contexts/PluginContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <WorkspaceProvider>
        <PluginProvider>
          <App />
        </PluginProvider>
      </WorkspaceProvider>
    </ThemeProvider>
  </StrictMode>,
)
