const common = {
  entry: './src/index.js',
  output: {
    path: `${__dirname}/dist`,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};

module.exports = [
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
