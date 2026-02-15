export default {
    id: 'font-inter',
    name: 'Inter Font',
    version: '1.0.0',
    description: 'Sets the application font to Inter.',
    initialize: (context) => {
        // 1. Load Google Fonts
        context.loadStylesheet('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        // 2. Apply to CSS variables
        context.setThemeVars({
            '--font-sans': '"Inter", sans-serif',
            '--font-head': '"Inter", sans-serif'
        });
    },
    destroy: () => {
    }
};
