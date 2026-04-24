import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import vuePlugin from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['dist/*', 'postcss.config.js']
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...vuePlugin.configs['flat/recommended'],
    eslintConfigPrettier,
    {
        files: ['./src/**/*.{ts,vue}'],
        languageOptions: {
            globals: {
                ...globals.browser
            },
            parserOptions: {
                parser: tseslint.parser
            }
        },
        rules: {
            indent: ['warn', 4, { SwitchCase: 1 }],
            'vue/html-indent': ['warn', 4],
            'space-before-function-paren': 'off'
        }
    }
);
