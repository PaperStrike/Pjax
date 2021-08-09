import type { Configuration } from 'webpack';

const common: Configuration = {
  entry: './src/index.ts',
  output: {
    path: `${__dirname}/dist`,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(m?j|t)s$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '...'],
  },
};

const configurations: Configuration[] = [
  {
    ...common,
    name: 'global-dev',
    output: {
      ...common.output,
      filename: 'pjax.js',
      library: {
        name: 'Pjax',
        type: 'global',
        export: 'default',
      },
    },
    mode: 'development',
  },
  {
    ...common,
    name: 'global-prod',
    output: {
      ...common.output,
      filename: 'pjax.min.js',
      library: {
        name: 'Pjax',
        type: 'global',
        export: 'default',
      },
    },
    mode: 'production',
  },
  {
    ...common,
    name: 'module-dev',
    output: {
      ...common.output,
      filename: 'pjax.esm.js',
      library: {
        type: 'module',
      },
    },
    mode: 'development',
    experiments: {
      outputModule: true,
    },
  },
  {
    ...common,
    name: 'module-prod',
    output: {
      ...common.output,
      filename: 'pjax.esm.min.js',
      library: {
        type: 'module',
      },
    },
    mode: 'production',
    experiments: {
      outputModule: true,
    },
  },
];

export default configurations;
