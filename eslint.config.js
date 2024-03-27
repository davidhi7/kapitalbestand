import eslint from '@eslint/js';
import mochaPlugin from 'eslint-plugin-mocha';
import vuePlugin from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    mochaPlugin.configs.flat.recommended,
    ...vuePlugin.configs['flat/recommended'],
    {
        rules: {
            indent: ['warn', 4],
            'vue/html-indent': ['warn', 4],
            'space-before-function-paren': 'off'
        },
        "languageOptions": {
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
                sourceType: 'module'
            }
        }
    }
);
