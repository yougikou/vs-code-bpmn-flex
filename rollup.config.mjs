import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import url from '@rollup/plugin-url';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

import css from 'rollup-plugin-css-only';

export default [

  // client
  {
    input: 'src/client/bpmn-editor.tsx',
    output: {
      sourcemap: true,
      format: 'iife',
      file: './out/client/bpmn-editor.js'
    },
    plugins: [
      url({
        fileName: '[dirname][filename][extname]',
        publicPath: '/media/'
      }),

      css({ output: 'bpmn-editor.css' }),

      typescript({
        tsconfig: 'src/client/tsconfig.json'
      }),

      resolve(),
      commonjs(),

      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        preventAssignment: true
      })
    ],
    watch: {
      clearScreen: false
    }
  },

  // app - extension
  {
    input: 'src/extension.ts',
    output: {
      sourcemap: true,
      format: 'commonjs',
      file: './out/extension.js'
    },
    external: [ 'vscode' ], // vscode is external
    plugins: [
      typescript(),
      resolve(),
      commonjs()
    ],
    watch: {
      clearScreen: false
    }
  },

  // app - bpmn-editor provider
  {
    input: 'src/bpmn-editor.ts',
    output: {
      sourcemap: true,
      format: 'commonjs',
      file: './out/bpmn-editor.js'
    },
    external: [ 'vscode' ],
    plugins: [
      typescript(),
      resolve(),
      commonjs()
    ],
    watch: {
      clearScreen: false
    }
  },

  // app - dispose
  {
    input: 'src/dispose.ts',
    output: {
      sourcemap: true,
      format: 'commonjs',
      file: './out/dispose.js'
    },
    external: [ 'vscode' ],
    plugins: [
      typescript(),
      resolve(),
      commonjs()
    ],
    watch: {
      clearScreen: false
    }
  },

  // app - util
  {
    input: 'src/util.ts',
    output: {
      sourcemap: true,
      format: 'commonjs',
      file: './out/util.js'
    },
    external: [ 'vscode' ],
    plugins: [
      typescript(),
      resolve(),
      commonjs()
    ],
    watch: {
      clearScreen: false
    }
  }
];
