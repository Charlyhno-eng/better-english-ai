import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/**']),
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [js.configs.recommended],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [hooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['public/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['public/**/*.worklet.js'],
    languageOptions: { globals: globals.audioWorklet },
  },
  {
    files: ['tests/**/*.mjs', 'vite.config.ts', '**/*.config.mjs'],
    languageOptions: { globals: globals.node },
  },
]);
