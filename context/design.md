# LocalWrite System Design

## System Overview
LocalWrite is a privacy-focused, offline-capable Markdown editor that interfaces directly with the user's local file system. It leverages modern web technologies to provide a native-app-like experience in the browser.

## Core Architecture

### 1. Data Layer: Direct File System Access
-   **Principle**: Zero database, zero cloud. Truth lives on the disk.
-   **Implementation**: Uses the **File System Access API** (`window.showDirectoryPicker`) to obtain a handle to a local folder.
-   **Hierarchy**:
    -   `storage.ts` provides the abstraction layer.
    -   `scanDirectory`: Recursively traverses directory handles to build an in-memory tree (`FileSystemItem[]`) of files and folders.
    -   `FileSystemHandle`: Persisted in IndexedDB to maintain access across sessions (browser permission model permitting).

### 2. Plugin Ecosystem
-   **Goal**: Modularize functionality to keep the core lightweight.
-   **Architecture**:
    -   **Registry**: A singleton `PluginManager` registers available plugins.
    -   **Context**: `PluginContext` exposes enabled/disabled state and plugin APIs to the component tree.
    -   **Persistence**: Plugin state (enabled/disabled) is saved in `localStorage`.
    -   **Integration Points**: Plugins can inject:
        -   Sidebar Icons (`renderSidebarIcon`)
        -   Sidebar Panels (`renderSidebarContent`)
        -   (Future) Editor overrides or toolbar items.

### 3. Editor Engine
-   **Core**: Built on **Slate.js**.
-   **Data Model**: Custom AST (Abstract Syntax Tree) representing Markdown nodes (`heading`, `list-item`, `check-list-item`, etc.).
-   **Serialization**: Two-way transform between Slate AST and standard Markdown text (`markdown.ts`).
    -   **Deserializer**: Parses Markdown strings into Slate nodes.
    -   **Serializer**: Converts Slate nodes back to Markdown strings for file saving.

### 4. Application Layout
-   **Structure**: Fixed-height view (`h-screen`).
    -   **Sidebar**: Sticky/Fixed left panel for navigation (File Tree, TOC, Plugin Panels).
    -   **Main Area**: Scrollable content area (`overflow-y-auto`) containing the Editor.
-   **Responsiveness**: Mobile-first design with a collapsible drawer for the sidebar on smaller screens.

## Technical Stack
-   **Framework**: React 18 + Vite.
-   **Language**: TypeScript.
-   **Styling**: TailwindCSS primarily, with `elements.css` for semantic content styling (typography).
-   **Testing**: Vitest + React Testing Library (JSDOM environment).
