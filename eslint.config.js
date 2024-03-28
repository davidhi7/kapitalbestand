import eslintConfigPrettier from 'eslint-config-prettier';
import mochaPlugin from 'eslint-plugin-mocha';
import vuePlugin from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

import eslint from '@eslint/js';

export default tseslint.config(
    {
        ignores: ['backend/dist/*', 'frontend/postcss.config.js']
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    mochaPlugin.configs.flat.recommended,
    ...vuePlugin.configs['flat/recommended'],
    eslintConfigPrettier,
    {
        rules: {
            indent: ['warn', 4],
            'vue/html-indent': ['warn', 4],
            'space-before-function-paren': 'off'
        },
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
                sourceType: 'module'
            }
        }
    },
    {
        files: ['backend/src/**/*'],
        ignores: ['backend/dist/*'],
        languageOptions: {
            globals: {
                ...globals.node
            }
        },
        rules: {
            // express error handler always have to accept four arguments even if unused
            // Otherwise, errors wont be passed to the middleware`
            '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
            'no-unused-vars': ['error', { args: 'none' }]
        }
    },
    {
        files: ['frontend/src/**/*'],
        languageOptions: {
            globals: {
                ...globals.browser
            }
        }
    }
);
