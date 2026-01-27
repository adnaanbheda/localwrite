# LocalWrite

A modern, minimalist rich text editor built with React, TypeScript, and Slate.js.

## Features

- **Rich Text Editing**: Full-featured text editor with support for bold, italic, underline, and more
- **Local Storage**: Automatically saves your work locally in your browser
- **Modern UI**: Clean, intuitive interface built with Tailwind CSS
- **Keyboard Shortcuts**: Efficient editing with familiar keyboard shortcuts
- **Context Menu**: Right-click context menu for quick formatting options

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Slate.js** - Rich text editing framework
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible UI components
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd localwrite
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
localwrite/
├── src/
│   ├── components/     # React components
│   ├── lib/           # Utility functions and helpers
│   ├── App.tsx        # Main application component
│   └── main.tsx       # Application entry point
├── public/            # Static assets
└── index.html         # HTML template
```

## License

MIT
