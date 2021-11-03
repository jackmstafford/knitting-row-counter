module.exports = {
  env: {
    browser: true,
    es2021: true,
    jquery: true,
  },
  extends: ['eslint:recommended', 'jquery', 'prettier'],
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
  },
};
