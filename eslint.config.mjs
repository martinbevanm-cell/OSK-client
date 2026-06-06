import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * Hex / rgb / hsl literals are banned in component & page files.
 * Colors MUST come from SCSS tokens (CSS custom properties). The token
 * source-of-truth lives under src/styles and is exempt.
 */
const HARDCODED_COLOR =
  "Literal[value=/#(?:[0-9a-fA-F]{3,4}){1,2}\\b|\\b(?:rgb|rgba|hsl|hsla)\\(/]";

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'node_modules/**', 'next-sitemap.config.js', 'coverage/**'],
  },
  {
    // No hardcoded colors anywhere in components/pages/features.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/styles/**', 'src/**/*.test.{ts,tsx}', 'src/**/__tests__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: HARDCODED_COLOR,
          message:
            'No hardcoded colors. Use an SCSS token (CSS custom property var(--token)).',
        },
      ],
    },
  },
  {
    // Cross-feature isolation: a feature may only import another feature
    // through its barrel index.ts, never its internal files.
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*', '!@/features/*/index'],
              message: 'Import other features only via their barrel index.ts.',
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
