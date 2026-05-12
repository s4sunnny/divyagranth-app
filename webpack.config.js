const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

// Packages that ship untranspiled ES modules or RN-specific syntax and must
// pass through Babel even though they live in node_modules.
const transpileModules = [
  'react-native-web',
  '@react-navigation',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-safe-area-context',
  'react-native-screens',
  '@react-native-async-storage',
  '@react-native-community',
].join('|');

const transpileRegex = new RegExp(
  `node_modules/(?!(${transpileModules})/)`,
);

module.exports = {
  mode: 'development',
  entry: './index.web.js',
  output: {
    path: path.resolve(__dirname, 'dist-web'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  devtool: 'eval-cheap-module-source-map',
  resolve: {
    // .web.* variants are checked before the plain extension, so any file
    // (or node_module) can ship a web-specific implementation alongside its
    // native one without us having to alias every module individually.
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
    alias: {
      // Core: map react-native → react-native-web
      'react-native$': 'react-native-web',
      // Stubs for packages that have no web build
      'react-native-linear-gradient': path.resolve(
        __dirname,
        'src/stubs/LinearGradient.web.tsx',
      ),
      'react-native-track-player': path.resolve(
        __dirname,
        'src/stubs/TrackPlayer.web.tsx',
      ),
      'react-native-tts': path.resolve(__dirname, 'src/stubs/Tts.web.ts'),
      'react-native-fs': path.resolve(__dirname, 'src/stubs/RNFS.web.ts'),
      'react-native-vector-icons/MaterialCommunityIcons': path.resolve(
        __dirname,
        'src/stubs/VectorIcons.web.tsx',
      ),
      '@react-native-community/slider': path.resolve(
        __dirname,
        'src/stubs/Slider.web.tsx',
      ),
      'react-native-video': path.resolve(
        __dirname,
        'src/stubs/Video.web.tsx',
      ),
      // Path alias used throughout the app (@/services, @/theme, …)
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: transpileRegex,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {targets: {browsers: ['last 2 versions']}}],
              ['@babel/preset-react', {runtime: 'automatic'}],
              '@babel/preset-typescript',
            ],
            plugins: [
              [
                'module-resolver',
                {root: ['./src'], alias: {'@': './src'}},
              ],
            ],
          },
        },
      },
      {
        // Font files (for MaterialCommunityIcons) and images
        test: /\.(ttf|otf|eot|woff|woff2|png|jpe?g|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    // Metro injects these globals; webpack doesn't — define them here.
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(true),
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
  ],
  devServer: {
    port: 3000,
    historyApiFallback: true,
    hot: true,
    open: true,
  },
};
