const path = require("path");

const config = {
  entry: {
    "content-scripts/index": "./src/content-scripts/index.ts",
    "event-pages/index": "./src/event-pages/index.ts",
    "popup/index": "./src/popup/index.ts",
  },
  output: {
    path: path.resolve(__dirname, "lib"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: [path.resolve(__dirname, "src")],
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  resolve: {
    extensions: [".ts"],
  },
};

module.exports = config;
