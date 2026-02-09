export default {
    id: 'theme-dracula',
    name: 'Dracula Theme',
    version: '1.0.2',
    description: 'A dark theme for localwrite.',
    initialize: (context) => {
        context.setThemeVars({
            '--background': '#282a36',
            '--foreground': '#f8f8f2',
            '--card': '#44475a',
            '--card-foreground': '#f8f8f2',
            '--popover': '#282a36',
            '--popover-foreground': '#f8f8f2',
            '--primary': '#bd93f9',
            '--primary-foreground': '#282a36',
            '--secondary': '#44475a',
            '--secondary-foreground': '#f8f8f2',
            '--muted': '#6272a4',
            '--muted-foreground': '#f8f8f2',
            '--accent': '#ff79c6',
            '--accent-foreground': '#282a36',
            '--destructive': '#ff5555',
            '--destructive-foreground': '#f8f8f2',
            '--border': '#6272a4',
            '--input': '#6272a4',
            '--ring': '#bd93f9',
            '--radius': '0.5rem'
        });
        console.log('Dracula theme loaded');
    },
    destroy: (context) => {
        console.log('Dracula theme disabled');
    }
};
