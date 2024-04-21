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

                'main-bg': 'var(--main-bg)',
                'secondary-bg': 'var(--secondary-bg)',
                'tertiary-bg': 'var(--tertiary-bg)',
                'input-bg': 'var(--input-bg)',
                'header-bg': 'var(--header-bg)',
                'header-bg-hover': 'var(--header-bg-hover)',

                positive: 'var(--positive)',
                negative: 'var(--negative)'
            },
            screens: {
                // desktop-first alternative breakpoints: smaller than sm/md/lg/xl/2xl
                m2xl: { max: '1535px' },
                mxl: { max: '1279px' },
                mlg: { max: '1023px' },
                mmd: { max: '767px' },
                msm: { max: '639px' }
            },
            transitionProperty: {
                'grid-cols': 'grid-template-columns',
                'grid-rows': 'grid-template-rows'
            }
        }
    },
    plugins: [
        // https://stackoverflow.com/a/71795600
        function ({ addVariant }) {
            addVariant('child', '& > *');
        }
    ],
    safelist: [
        {
            pattern: /grid-cols-\d+/,
            variants: ['sm', 'md', 'lg', 'xl', '2xl']
        }
    ]
};
