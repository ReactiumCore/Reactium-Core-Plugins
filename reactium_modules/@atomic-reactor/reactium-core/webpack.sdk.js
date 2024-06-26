const {
    ...ReactiumWebpack
} = require('@atomic-reactor/reactium-sdk-core/core');
const { registryFactory, Registry } = ReactiumWebpack;
const op = require('object-path');
const _ = require('underscore');
const webpack = require('webpack');
const globby = require('./globby-patch');
const chalk = require('chalk');
const path = require('path');
const rootPath = path.resolve(__dirname, '../../..');

global.rootPath = rootPath;
global.ReactiumWebpack = ReactiumWebpack;

let artifacts = {};
class WebpackReactiumWebpack {
    constructor(name, ddd, context) {
        this.name = name;
        this.context = context;
        this.cache = {
            type: 'filesystem',
        };

        // setter/getter initial values
        this.entryValue = {
            main: './src/app/main.js',
        };
        this.modeValue = 'development';
        this.targetValue = 'web';
        this.outputValue = {};
        this.devtoolValue = '';
        this.optimizationValue = {
            minimize: false,
        };

        this.resolveAliases = registryFactory(
            'resolveAliases',
            'id',
            Registry.MODES.CLEAN,
        );
        this.resolveAliases.sdk = this;

        this.transpiledDependencies = registryFactory(
            'transpiledDependencies',
            'module',
            Registry.MODES.CLEAN,
        );
        this.transpiledDependencies.sdk = this;

        this.ignores = registryFactory('ignores', 'id', Registry.MODES.CLEAN);
        this.ignores.sdk = this;

        this.externals = registryFactory(
            'externals',
            'id',
            Registry.MODES.CLEAN,
        );
        this.externals.sdk = this;

        this.rules = registryFactory('rules', 'id', Registry.MODES.CLEAN);
        this.rules.sdk = this;

        this.plugins = registryFactory('plugins', 'id', Registry.MODES.CLEAN);
        this.plugins.sdk = this;

        this.extensions = ['.js', '.jsx', '.json'];

        this.overridesValue = {};

        // avoid costly globbing
        if (op.get(artifacts, [ddd])) return;

        globby
            .sync([`./src/**/${ddd}`, `./reactium_modules/**/${ddd}`])
            .forEach(file => {
                try {
                    require(path.resolve(file));
                } catch (error) {
                    console.error(chalk.red(`Error loading ${file}:`));
                    console.error(error);
                }
            });

        op.set(artifacts, [ddd], true);
    }

    set mode(value) {
        this.modeValue = value;
    }

    get mode() {
        return this.modeValue;
    }

    set entry(value) {
        this.entryValue = value;
    }

    get entry() {
        return this.entryValue;
    }

    set target(value) {
        this.targetValue = value;
    }

    get target() {
        return this.targetValue;
    }

    set output(value) {
        this.outputValue = value;
    }

    get output() {
        return this.outputValue;
    }

    set devtool(value) {
        this.devtoolValue = value;
    }

    get devtool() {
        return this.devtoolValue;
    }

    set optimization(value) {
        this.optimizationValue = value;
    }

    get optimization() {
        return this.optimizationValue;
    }

    set overrides(value) {
        this.overridesValue = value;
    }

    get overrides() {
        return this.overridesValue || {};
    }

    addResolveAlias(id, alias) {
        this.resolveAliases.register(id, { alias });
    }

    addRule(id, rule, order = 100) {
        this.rules.register(id, { rule, order });
    }

    addIgnore(id, resourceRegExp, contextRegExp) {
        const config = { resourceRegExp };
        if (contextRegExp) config.contextRegExp = contextRegExp;
        this.plugins.register(`ignore-${id}`, {
            plugin: new webpack.IgnorePlugin(config),
        });
    }

    addPlugin(id, plugin) {
        this.plugins.register(id, { plugin });
    }

    addTranspiledDependency(module) {
        this.transpiledDependencies.register(module);
    }

    addContext(id, context) {
        const { from, to } = context;
        this.plugins.register(id, {
            plugin: new webpack.ContextReplacementPlugin(from, context => {
                context.request = to;
            }),
        });
    }

    addExternal(id, config) {
        const { key, value } = config;
        if (typeof key === 'string' || key instanceof String) {
            // regex string
            if (/^\/.*\/i?$/.test(key)) {
                const args = [key.replace(/^\//, '').replace(/\/i?$/, '')];
                if (/i$/.test(key)) args.push('i');
                this.externals.register(id, { external: new RegExp(...args) });
                // string keypair
            } else {
                this.externals.register(id, { external: { key, value } });
            }
        } else if (typeof value === 'object' && value instanceof RegExp) {
            this.externals.register(id, { external: value });
        } else if (Array.isArray(value)) {
            this.externals.register(id, { external: { key, value } });
        } else if (typeof value === 'function') {
            this.externals.register(id, { external: value });
        }
    }

    getIgnores() {
        ReactiumWebpack.Hook.runSync(
            'ignores',
            this.ignores,
            this.name,
            this.context,
        );

        const ignores = this.ignores.list;
        if (ignores.length > 0) {
            return {
                test: ignores.map(ignore => ignore.test),
                use: [
                    {
                        loader: 'ignore-loader',
                    },
                ],
            };
        }

        return false;
    }

    getExternals() {
        ReactiumWebpack.Hook.runSync(
            'externals',
            this.externals,
            this.name,
            this.context,
        );
        return _.compact(
            this.externals.list.map(({ external }) => {
                if (typeof external === 'object' && 'key' in external) {
                    const { key, value } = external;
                    return { [key]: value };
                }

                return external;
            }),
        );
    }

    getRules() {
        ReactiumWebpack.Hook.runSync(
            'rules',
            this.rules,
            this.name,
            this.context,
        );
        return this.rules.list.map(({ id, rule }) => rule);
    }

    getPlugins() {
        ReactiumWebpack.Hook.runSync(
            'plugins',
            this.plugins,
            this.name,
            this.context,
        );
        return this.plugins.list.map(({ id, plugin }) => plugin);
    }

    matchChunk(test) {
        return module => {
            const moduleName =
                module.nameForCondition && module.nameForCondition();
            return test.test(moduleName);
        };
    }

    setNoCodeSplitting(env) {
        this.optimizationValue = {
            minimize: Boolean(env !== 'development'),
        };

        this.addPlugin(
            'limit-chunks',
            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 1,
            }),
        );
    }

    setWebpackDefaultOptimize(env) {
        this.optimizationValue = {
            minimize: Boolean(env !== 'development'),
            splitChunks: {
                chunks: 'async',
                minSize: 20000,
                minRemainingSize: 0,
                minChunks: 1,
                maxAsyncRequests: 30,
                maxInitialRequests: 30,
                enforceSizeThreshold: 50000,
                cacheGroups: {
                    defaultVendors: {
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10,
                        reuseExistingChunk: true,
                    },
                    default: {
                        minChunks: 2,
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                },
            },
        };
    }

    setCodeSplittingOptimize(env) {
        this.optimizationValue = {
            minimize: Boolean(env !== 'development'),
            chunkIds: 'named',
            splitChunks: {
                chunks: 'all',
                minSizeReduction: 500000,
                cacheGroups: {
                    main: {
                        minChunks: 1,
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                },
            },
        };
    }

    config() {
        ReactiumWebpack.Hook.runSync('before-config', this);

        if (this.transpiledDependencies.list.length > 0) {
            this.addRule('babel-loader', {
                test: [/\.jsx|js($|\?)/],
                exclude: [
                    new RegExp(
                        `node_modules\/(?!(${this.transpiledDependencies.list
                            .map(({ module }) => module)
                            .join('|')})\/).*`,
                    ),
                    /umd.js$/,
                ],
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
        }

        const theConfig = {
            mode: this.mode,
            cache: this.cache,
            target: this.target,
            output: this.output,
            entry: this.entry,
            optimization: this.optimization,
            externals: this.getExternals(),
            module: {
                rules: _.compact([...this.getRules()]),
            },
            plugins: this.getPlugins(),
            ...this.overrides,
        };

        if (this.devtool) theConfig.devtool = this.devtool;

        if (this.resolveAliases.list.length > 0) {
            const alias = {};
            this.resolveAliases.list.forEach(({ id: from, alias: to }) => {
                alias[from] = to;
            });
            theConfig.resolve = { alias, extensions: this.extensions };
        }

        ReactiumWebpack.Hook.runSync('after-config', theConfig, this);
        return theConfig;
    }
}

module.exports = WebpackReactiumWebpack;
