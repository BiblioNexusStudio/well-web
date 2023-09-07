/** @type {import("tailwindcss").Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    future: {
        hoverOnlyWhenSupported: true,
    },
    theme: {
        extend: {
            colors: {
                'primary-50': 'var(--primary-50)',
                'primary-300': 'var(--primary-300)',
                'base-700': 'var(--base-700)',
            },
        },
    },
    plugins: [require('@tailwindcss/typography'), require('daisyui')],
    daisyui: {
        themes: [
            'light',
            'dark',
            'night',
            'business',
            {
                biblioNexusLight: {
                    'color-scheme': 'light',
                    primary: '#817556',
                    'primary-content': '#FFFFFF',
                    secondary: '#F0EDE4',
                    'secondary-content': '#585133',
                    accent: '#DC8850',
                    neutral: '#475467',
                    'base-100': '#ffffff',
                    'base-200': '#F9FAFB',
                    'base-content': '#101828',
                    '--base-700': '#344054',
                    '--primary-50': '#F0EDE4',
                    '--primary-300': '#B5AC8B',
                },
            },
        ], // true: all themes | false: only light + dark | array: specific themes like this ["light", "dark", "cupcake"]
        darkTheme: 'dark', // name of one of the included themes for dark mode
        base: true, // applies background color and foreground color for root element by default
        styled: true, // include daisyUI colors and design decisions for all components
        utils: true, // adds responsive and modifier utility classes
        rtl: false, // rotate style direction from left-to-right to right-to-left. You also need to add dir="rtl" to your html tag and install `tailwindcss-flip` plugin for Tailwind CSS.
        prefix: '', // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
        logs: false, // Shows info about daisyUI version and used config in the console when building your CSS
    },
};
