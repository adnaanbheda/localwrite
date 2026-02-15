// public/plugins/font-loader.js
export default {
    id: 'font-loader',
    name: 'Generic Font Loader',
    version: '1.0.0',
    description: 'Loads a custom font from a URL.',
    initialize: async (context) => {
        let fontUrl = context.getSetting('fontUrl');
        
        if (!fontUrl) {
            fontUrl = await context.prompt('Enter Font URL (e.g., Google Fonts CSS link):', 
                'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            
            if (fontUrl) {
                context.setSetting('fontUrl', fontUrl);
            }
        }

        if (fontUrl) {
            // Load the stylesheet
            context.loadStylesheet(fontUrl);

            // Ask for the font family name to apply
            let fontFamily = context.getSetting('fontFamily');
            if (!fontFamily) {
                fontFamily = await context.prompt('Enter Font Family name (e.g., "Inter"):', 'Inter');
                if (fontFamily) {
                    context.setSetting('fontFamily', fontFamily);
                }
            }

            if (fontFamily) {
                 context.setThemeVars({
                    '--font-sans': `"${fontFamily}", sans-serif`,
                    '--font-head': `"${fontFamily}", sans-serif`
                });
            }
        }
    },
    destroy: (context) => {
    }
};
