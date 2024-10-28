const path = require("path");
const Dotenv = require("dotenv-webpack");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  entry: {
    main: "./src/index.js",
  },
  output: {
    path: path.join(__dirname, "dist"),
    publicPath: "/",
    filename: "index.cjs",
    clean: true,
  },
  plugins: [
    new Dotenv({
      path: ".env",
    }),
  ],
  mode: "production",
  target: "node",
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
    ],
  },
};
