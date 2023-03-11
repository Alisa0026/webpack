const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const TemplatedPathPlugin = require('./my-plugin')
const AutoTryCatch = require('./try-catch-plugin')

module.exports = {
    mode: 'development',
    devtool: "cheap-module-source-map",
    // entry: "./src/index.js",
    entry: "./src/react.js",
    // entry: './src/test.js', // 修改文件入口
    output: {
        path: path.resolve(__dirname, 'output'),
        // filename: '[name].[hash:6].js'
        filename: '[name].js',
        library: {
            name: 'webpackNumbers',
            type: 'umd'
        }
    },
    devServer: {
        port: 8000,//改下端口
        hot: true
    },
    // extrnal: {
    //     'react': 'React', // 这个时候产物类似 import React from 'react'; ==> const React = window.React => <script src="react.cdn"/>
    // },
    module: {
        rules: [{
            test: /\.js$/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [
                        '@babel/preset-env',
                        '@babel/preset-react'
                    ],
                    plugins: [
                        // "@babel/plugin-transform-runtime", // 作用：很多组件独立的，每个里都会打一份环境，比如浏览器是IE，用promise，每个文件里都会打promise，这样文件就大。runtime就是运行时判断，用到了，会以引用的方式加载外部的一个模块，不是把模块打到所有文件里，有重复代码。
                        ["@babel/plugin-proposal-decorators", { "legacy": true }]
                    ]
                }
            }
        }, {
            test: /\.css$/,
            // use: ['style-loader', 'css-loader'] // css-loader处理文件，style-loader是插入标签
            // 生成了css的文件，但是没有插入到html中
            use: [MiniCssExtractPlugin.loader, {
                loader: 'css-loader',
                // options: {
                //     modules: true
                // }
            }] // 现在不希望用style标签
        }, {
            test: /\.mobile$/,
            use: [
                'style-loader',
                'css-loader',
                {
                    loader: './mobile-css-loader', // 自定义loader
                    options: {
                        width: 750,
                    }
                }
            ]
        }]
    },
    plugins: [
        // new AutoTryCatch(),
        // new TemplatedPathPlugin(),
        new HtmlWebpackPlugin({
            template: './index.html' // 打包的产物会自动引入到这里
        }),
        // 样式独立成样式表
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        })
    ],
    optimization: {
        splitChunks: { // 拆分块
            cacheGroups: { // 缓存组，有些依赖在开发的时候不变的，不需要每次更新可以做强缓存
                vendor: {
                    filename: 'vendor.js',
                    chunks: 'all', // async,initial，组件有同步组件和异步组件，拆包依据不区分同步异步的包就all，只打异步的包就用 async
                    test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/
                },
            }
        }
    }
}