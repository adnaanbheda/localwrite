# localwrite

A **local-first** rich text editor for personal notes and writing. Your data stays on your device—no servers, no sync, no tracking.

**Live Demo:** [localwrite.adnaan.me](https://localwrite.adnaan.me)

## Philosophy

LocalWrite isn't trying to compete with powerful editors like Obsidian or Google Docs. Instead, it's built for quick, personal writing where **privacy and simplicity matter most**. 

Perfect for:
- Quick notes and thoughts
- Personal journaling
- Draft writing
- Anything you want to keep completely private and local

## Features

- **100% Local**: Everything stays in your browser—no data ever leaves your device
- **Privacy First**: No accounts, no servers, no tracking, no data collection
- **Instant Access**: Just open and write—no setup, no configuration
- **Rich Text Support**: Basic formatting (bold, italic, underline) for readable notes
- **Auto-Save**: Your work saves automatically to your local file system
- **Keyboard Shortcuts**: Efficient editing with familiar shortcuts
- **Clean Interface**: Distraction-free writing experience

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
