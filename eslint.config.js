import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

import mochaPlugin from 'eslint-plugin-mocha';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  mochaPlugin.configs.flat.recommended,
  {
    "rules": {
      "indent": ["warn", 4],
      "space-before-function-paren": 'off'
    }
  }
)
