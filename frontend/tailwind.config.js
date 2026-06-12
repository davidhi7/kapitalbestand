/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                gradient: {
                    0: 'var(--gradient-0)',
                    1: 'var(--gradient-1)'
                },
                main: 'var(--main)',
                secondary: 'var(--secondary)',
                tertiary: 'var(--tertiary)',
                'main-dark': 'var(--main-dark)',

                positive: 'var(--positive)',
                negative: 'var(--negative)'
            },
            transitionProperty: {
                'grid-cols': 'grid-template-columns',
                'grid-rows': 'grid-template-rows'
            }
        }
    }
};
