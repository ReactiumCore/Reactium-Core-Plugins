'use strict';

const fs = require('fs');
const _ = require('underscore');
const path = require('path');
const globby = require('./globby-patch');
const CompressionPlugin = require('compression-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const env = process.env.NODE_ENV || 'development';
const chalk = require('chalk');
const WebpackSDK = require('./webpack.sdk');

const overrides = config => {
    globby
        .sync([
            './webpack.override.js',
            './src/**/webpack.override.js',
            './reactium_modules/**/webpack.override.js',
        ])
        .forEach(file => {
            try {
                config = require(path.resolve(file))(config);
            } catch (error) {
                console.error(chalk.red(`Error loading ${file}:`));
                console.error(error);
            }
        });
    return config;
};

module.exports = config => {
    const sdk = new WebpackSDK('reactium', 'reactium-webpack.js', config);

    let filename = '[name].js';
    let dest = config.dest.js;

    sdk.mode = env;
    sdk.entry = config.entries;
    sdk.target = 'web';
    sdk.output = {
        publicPath: '/assets/js/',
        path: path.resolve(rootPath, dest),
        filename,
        asyncChunks: true,
    };
    if (env === 'development') {
        sdk.devtool = 'source-map';
    }

    sdk.setCodeSplittingOptimize(env);
    if (process.env.DISABLE_CODE_SPLITTING === 'true') {
        sdk.setNoCodeSplitting();
    }

    sdk.addPlugin(
        'node-polyfills',
        new NodePolyfillPlugin({
            excludeAliases: ['console'],
        }),
    );
    sdk.addContext('reactium-modules-context', {
        from: /reactium-translations$/,
        to: path.resolve('./src/reactium-translations'),
    });

    if (env === 'production') {
        sdk.addPlugin('asset-compression', new CompressionPlugin());
    }

    sdk.addRule('po-loader', {
        test: [/\.pot?$/],
        use: [
            {
                loader: '@atomic-reactor/webpack-po-loader',
                options: {
                    format: 'jed1.x',
                    domain: 'messages',
                },
            },
        ],
    });

    sdk.addRule('babel-loader', {
        test: [/\.jsx|js($|\?)/],
        exclude: [/node_modules/, /umd.js$/, /\.cli/],
        resolve: {
            extensions: ['.js', '.jsx', '.json'],
        },
        use: [
            {
                loader: 'babel-loader',
                options: {
                    cacheCompression: false,
                    cacheDirectory: true,
                },
            },
        ],
    });

    sdk.addIgnore('umd', /umd.js$/);
    sdk.addIgnore('hbs', /\.hbs$/);
    sdk.addIgnore('css', /\.css$/);
    sdk.addIgnore('sass', /\.sass$/);
    sdk.addIgnore('scss', /\.scss$/);
    sdk.addIgnore('less', /\.less$/);
    sdk.addIgnore('backup', /\.BACKUP$/);
    sdk.addIgnore('png', /\.png$/);
    sdk.addIgnore('jpg', /\.jpg$/);
    sdk.addIgnore('gif', /\.gif$/);
    sdk.addIgnore('server-src', /reactium-core[/\\]{1}server/);
    sdk.addIgnore('manifest-tools', /reactium-core[/\\]{1}manifest/);
    sdk.addIgnore('core-index', /reactium-core[/\\]{1}index.mjs/);
    sdk.addIgnore('gulp', /reactium-core[/\\]{1}gulp/);
    sdk.addIgnore(
        'reactium-config',
        /reactium-core[/\\]{1}reactium-config.js$/,
    );
    sdk.addIgnore('webpack-sdk', /reactium-core[/\\]{1}webpack\.sdk/);
    sdk.addIgnore('core-configs', /reactium-core[/\\]{1}.*?\.config/);
    sdk.addIgnore('core-cli', /reactium-core[/\\]{1}.cli[/\\]{1}/);
    sdk.addIgnore('project-cli', /\.cli/);
    sdk.addIgnore('server-app', /src[/\\]{1}app[/\\]{1}server/);
    sdk.addIgnore('arcli-install', /arcli-install.js$/);
    sdk.addIgnore('arcli-publish', /arcli-publish.js$/);
    sdk.addIgnore('reactium-boot', /reactium-boot$/);
    sdk.addIgnore('reactium-gulp', /reactium-gulp$/);
    sdk.addIgnore('reactium-webpack', /reactium-webpack$/);
    sdk.addIgnore('parse-node', /parse[/\\]{1}node/);
    sdk.addIgnore('xmlhttprequest', /xmlhttprequest/);

    return overrides(sdk.config());
};
