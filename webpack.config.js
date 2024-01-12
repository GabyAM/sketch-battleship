const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
	entry: "./src/index.js",
	output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, "dist"),
	},
	mode: "production",
	module: {
		rules: [
			{
				test: /\.css$/,
				// include: path.resolve(__dirname, "root"),
				use: [MiniCssExtractPlugin.loader, "css-loader"],
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				type: "asset/resource",
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "./index.html",
		}),
		new MiniCssExtractPlugin({
			filename: "style.css",
		}),
	],
	optimization: {
		minimizer: [new CssMinimizerPlugin()],
	},
};
