const fs = require('fs');
const path = require('path');
const globby = require('./globby-patch');
const op = require('object-path');
const env = process.env.NODE_ENV || 'development';
const CompressionPlugin = require('compression-webpack-plugin');
const webpack = require('webpack');
const WebpackSDK = require('./webpack.sdk');

const overrides = (umd, config) => {
    globby
        .sync([
            './umd.webpack.override.js',
            './src/**/umd.webpack.override.js',
            './reactium_modules/**/umd.webpack.override.js',
        ])
        .forEach(file => {
            try {
                config = require(path.resolve(file))(umd, config);
            } catch (error) {
                console.error(chalk.red(`Error loading ${file}:`));
                console.error(error);
            }
        });
    return config;
};

module.exports = umd => {
    const sdk = new WebpackSDK(umd.libraryName, 'reactium-webpack.js', umd);
    sdk.addIgnore('hbs', /\.hbs$/);
    sdk.addIgnore('css', /\.css$/);
    sdk.addIgnore('sass', /\.sass$/);
    sdk.addIgnore('scss', /\.scss$/);
    sdk.addIgnore('less', /\.less$/);
    sdk.addIgnore('backup', /\.BACKUP$/);
    sdk.addIgnore('png', /\.png$/);
    sdk.addIgnore('jpg', /\.jpg$/);
    sdk.addIgnore('gif', /\.gif$/);
    sdk.addIgnore('server-src', /server/);
    sdk.addIgnore(
        'manifest-tools-main',
        /manifest\/(manifest-tools|processors|templates)/,
    );
    sdk.addIgnore('core-index', /reactium-core\/index.mjs/);
    sdk.addIgnore('gulp', /gulp/);
    sdk.addIgnore('reactium-config', /reactium-config.js$/);
    sdk.addIgnore('webpack-sdk', /webpack/);
    sdk.addIgnore('core-configs', /.*?\.config/);
    sdk.addIgnore('project-cli', /\.cli/);
    sdk.addIgnore('server-app', /src\/app\/server/);
    sdk.addIgnore('arcli-install', /arcli-install.js$/);
    sdk.addIgnore('arcli-publish', /arcli-publish.js$/);
    sdk.addIgnore('reactium-boot', /reactium-boot$/);
    sdk.addIgnore('reactium-gulp', /reactium-gulp$/);
    sdk.addIgnore('reactium-webpack', /reactium-webpack$/);
    sdk.addIgnore('parse-node', /parse\/node/);
    sdk.addIgnore('xmlhttprequest', /xmlhttprequest/);

    const plugins = [];
    const presets = [];
    const rules = [];
    const defines = op.get(umd, 'staticDefines', {});

    if (op.get(umd, 'babelPresetEnv', true)) presets.push('@babel/preset-env');
    if (op.get(umd, 'babelReact', true)) presets.push('@babel/react');
    if (op.get(umd, 'babelLoader', true))
        sdk.addRule('babel-loader', {
            test: /(\.jsx|\.js)$/,
            loader: 'babel-loader',
            options: {
                presets,
                plugins: [
                    [
                        '@babel/plugin-proposal-class-properties',
                        {
                            loose: true,
                        },
                    ],
                    ['module-resolver'],
                ],
            },
        });

    if (op.get(umd, 'workerRestAPI', true)) {
        op.set(
            defines,
            'workerRestAPIConfig',
            JSON.stringify({
                actiniumAppId: process.env.ACTINIUM_APP_ID || 'Actinium',
                restAPI: process.env.WORKER_REST_API_URL || '/api',
            }),
        );
    }

    const externals = [];
    Object.entries(umd.externals).forEach(([key, value]) => {
        sdk.addExternal(key, { key, value });
    });

    if (op.get(umd, 'addDefines', true)) {
        sdk.addPlugin('defines', new webpack.DefinePlugin(defines));
    }

    sdk.mode = env;
    sdk.entry = umd.entry;
    sdk.output = {
        path: umd.outputPath,
        filename: umd.outputFile,
        library: umd.libraryName,
        libraryTarget: 'umd',
        globalObject: umd.globalObject,
    };

    if (env === 'production') {
        sdk.addPlugin('compression', new CompressionPlugin());
    } else if (op.get(umd, 'sourcemaps', true)) {
        sdk.devtool = 'cheap-source-map';
    }

    return overrides(umd, sdk.config());
};
