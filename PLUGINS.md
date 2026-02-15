# LocalWrite Plugin Documentation

LocalWrite supports a flexible plugin system that allows developers to extend the application's functionality, inject custom themes, and add UI elements like sidebar panels.

## Table of Contents
- [Plugin Structure](#plugin-structure)
- [Lifecycle Methods](#lifecycle-methods)
- [Plugin Context API](#plugin-context-api)
- [UI Extensions](#ui-extensions)
- [Examples](#examples)

---

## Plugin Structure

Plugins are standalone JavaScript files (ES Modules) that export a default object complying with the `Plugin` interface.

```typescript
export default {
  id: 'my-plugin-id',          // Unique identifier
  name: 'My Plugin',           // Display name
  version: '1.0.0',            // Version string
  description: 'Short desc',    // Purpose of the plugin

  // Lifecycle Methods (Optional)
  initialize: async (context) => { ... },
  destroy: (context) => { ... },

  // UI Extensions (Optional)
  renderSidebarIcon: () => <Icon />,
  renderSidebarContent: (props) => <Content {...props} />
};
```

## Lifecycle Methods

### `initialize(context: PluginContext)`
Called when the plugin is loaded or enabled. This is where you should:
- Register CSS variables for themes.
- Load external stylesheets.
- Prompt users for configuration.
- Set up event listeners or background logic.

*Note: `initialize` can be `async`.*

### `destroy(context: PluginContext)`
Called when the plugin is unloaded or disabled. Use this to:
- Clean up resources.
- Remove injected stylesheets.
- Reset any global state changed by the plugin.

## Plugin Context API

The `context` object provided to lifecycle methods allows interaction with the host application:

### UI & Styling
- `setThemeVars(vars: Record<string, string>)`: Inject CSS variables into the root `:root` or theme provider.
- `unsetThemeVars(keys: string[])`: Remove specific CSS variables.
- `loadStylesheet(url: string)`: Dynamically append a `<link>` tag to load external CSS.
- `removeStylesheet(url: string)`: Remove a previously loaded stylesheet.

### Persistence & Input
- `getSetting(key: string)`: Get a value from the plugin's persistent storage.
- `setSetting(key: string, value: string)`: Persist a value for this plugin.
- `prompt(message: string, defaultValue?: string)`: Show a system dialog to the user. Returns a `Promise<string | null>`.

## UI Extensions

Plugins can add their own tabs to the application sidebar.

### `renderSidebarIcon()`
Returns a React component (usually an SVG icon) to be displayed in the sidebar navigation rail.

### `renderSidebarContent(props: PluginSidebarProps)`
Returns the main content area for the plugin's sidebar tab. It receives the following props:
- `dirHandle`: Access to the current workspace directory handle.
- `currentFile`: Handle to the currently active file.
- `editorContent`: The raw data structure of the editor (Slate Descendants).
- `onRestore(content: string)`: A callback to replace the editor content.

## Examples

### 1. Minimal Theme Plugin
```javascript
export default {
  id: 'theme-minimal-dark',
  name: 'Minimal Dark',
  initialize: (context) => {
    context.setThemeVars({
      '--background': '#1a1a1a',
      '--foreground': '#ffffff',
      '--primary': '#bb86fc'
    });
  }
};
```

### 2. External Resource Plugin
```javascript
export default {
  id: 'font-inter',
  name: 'Inter Font',
  initialize: (context) => {
    context.loadStylesheet('https://fonts.googleapis.com/css2?family=Inter&display=swap');
    context.setThemeVars({ '--font-sans': '"Inter", sans-serif' });
  },
  destroy: (context) => {
    context.removeStylesheet('https://fonts.googleapis.com/css2?family=Inter&display=swap');
  }
};
```
