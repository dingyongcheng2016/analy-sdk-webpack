const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const buildDirectory = "dist";

const mode = process.env.NODE_ENV || "development"

module.exports = {
  mode,
  entry: "./src/index.js",
  output: {
    library: {
      root: 'Analysis',
      amd: 'Analysis',
      commonjs: 'Analysis'
    },
    libraryTarget: 'umd',
    libraryExport: 'default',
    path: path.join(__dirname, buildDirectory),
    filename: "analysis.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            plugins: [
              ["@babel/plugin-proposal-decorators", { legacy: true }],
              "@babel/plugin-proposal-function-sent",
              "@babel/plugin-proposal-export-namespace-from",
              "@babel/plugin-proposal-numeric-separator",
              "@babel/plugin-proposal-throw-expressions",
              ["@babel/plugin-proposal-class-properties", { loose: false }],
            ],
            presets: ["@babel/preset-env"],
          },
        },
      },
      
    ],
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [`${buildDirectory}/**/*`]
    })
  ],
};
