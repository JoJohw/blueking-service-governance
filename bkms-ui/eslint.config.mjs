import bkuiLint from '@blueking/bkui-lint/eslint.mjs';

export default [
  ...bkuiLint,
  {
    files: ['*.vue'],
    parser: 'vue-eslint-parser',
    parserOptions: {
      parser: '@typescript-eslint/parser',
      jsx: true,
    },
  },
  {
    rules: {
      '@typescript-eslint/member-ordering': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    ignores: ['src/api/modules/**/*.ts'],
  },
];
