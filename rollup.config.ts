import { RollupOptions } from 'rollup';
import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import compiler from '@ampproject/rollup-plugin-closure-compiler';

const common: RollupOptions = {
  input: './src/index.ts',
  output: {
    sourcemap: true,
    sourcemapPathTransform: (sourcePath) => new URL(
      sourcePath
        .replace(/\\/g, '/')
        .replace(/^\.\.\/src\//, '/'),
      'source://Pjax',
    ).href,
  },
  plugins: [
    nodeResolve({
      browser: true,
      dedupe: ['core-js-pure'],
      extensions: ['.ts'],
    }),
    babel({
      babelHelpers: 'runtime',
      extensions: ['.ts'],
    }),
  ],
};

/**
 * Development and production outputs seperated for different plugins.
 * rollup-plugin-closure-compiler is not an output plugin.
 */
const configurations: RollupOptions[] = [
  /** development outputs */
  {
    ...common,
    output: [
      {
        ...common.output,
        format: 'es',
        file: './dist/pjax.esm.js',
      },
      {
        ...common.output,
        format: 'iife',
        file: './dist/pjax.js',
        name: 'Pjax',
      },
    ],
  },
  /** production outputs */
  {
    ...common,
    output: [
      {
        ...common.output,
        compact: true,
        format: 'es',
        file: './dist/pjax.esm.min.js',
      },
      {
        ...common.output,
        compact: true,
        format: 'iife',
        file: './dist/pjax.min.js',
        name: 'Pjax',
      },
    ],
    plugins: [
      ...common.plugins || [],
      compiler(),
    ],
  },
];

export default configurations;
