import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        // TD-405：啟用型別資訊，讓子 no-floating-promises / await-thenable 等規則能跨檔案追蹤型別
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      // 寬鬆處理，讓 Gate 2 跑得起來
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      // TD-405：浮動 Promise 守門員（防止 async 函數忘 await，導致 runtime 才崩潰）
      // 嚴格度：error（阻塞 lint gate）+ ignoreVoid 允許 `void somePromise()` 明確標註
      '@typescript-eslint/no-floating-promises': [
        'error',
        { ignoreVoid: true },
      ],
      // TD-405 補充：禁止靜默丟棄 await 後的 Promise 結果
      '@typescript-eslint/await-thenable': 'error',
    },
  },
];
