export default {
    id: 'theme-pink',
    name: 'Pink & Cute',
    version: '1.0.0',
    category: 'theme',
    description: 'A soft, pink, and extra rounded theme.',
    initialize: (context) => {
        context.setThemeVars({
            '--background': '#fff5f7',
            '--foreground': '#4a1d24',
            '--card': '#ffffff',
            '--card-foreground': '#4a1d24',
            '--popover': '#ffffff',
            '--popover-foreground': '#4a1d24',
            '--primary': '#ff85a1',
            '--primary-hover': '#ff709b',
            '--primary-foreground': '#ffffff',
            '--secondary': '#fce4ec',
            '--secondary-hover': '#f8bbd0',
            '--secondary-foreground': '#ad1457',
            '--muted': '#fce4ec',
            '--muted-foreground': '#ad1457',
            '--accent': '#ffc1e3',
            '--accent-hover': '#ffb1d9',
            '--accent-foreground': '#ad1457',
            '--destructive': '#ff4d6d',
            '--destructive-foreground': '#ffffff',
            '--border': '#f8bbd0',
            '--input': '#f8bbd0',
            '--ring': '#ff85a1',
            '--radius': '1rem'
        });
    },
    destroy: (context) => {
    }
};
