'use strict';

const del = require('del');
const fs = require('fs-extra');
const op = require('object-path');
const path = require('node:path');
const globby = require('./globby-patch');
const webpack = require('webpack');
const browserSync = require('browser-sync');
const gulpif = require('gulp-if');
const gulpwatch = require('@atomic-reactor/gulp-watch');
const prefix = require('gulp-autoprefixer');
const sass = require('gulp-sass')(require('sass-embedded'));
const gzip = require('gulp-gzip');
const reactiumImporter = require('@atomic-reactor/node-sass-reactium-importer');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const chalk = require('chalk');
const reactiumConfig = require('./reactium-config');
const { regenManifest } = require('./manifest/manifest-tools');
const umdWebpackGenerator = require('./umd.webpack.config');
const { fork, spawn } = require('child_process');
const handlebars = require('handlebars');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const _ = require('underscore');
const db = require('mime-db');
const mime = require('mime-type')(db);

// For backward compatibility with gulp override tasks using run-sequence module
// make compatible with gulp4
require('module-alias').addAlias('run-sequence', 'gulp4-run-sequence');

const reactium = (gulp, config, webpackConfig) => {
    const { Registry, registryFactory, Enums, Hook } = ReactiumGulp;
    axiosRetry(axios, {
        retries: config.serverRetries,
        retryDelay: retryCount => {
            console.log(`retry attempt: ${retryCount}`);
            return retryCount * config.serverRetryDelay; // time interval between retries
        },
    });

    const task = require('./get-task')(gulp);

    const env = process.env.NODE_ENV || 'development';
    const isDev = env === 'development';

    const assetPath = p => {
        p.dirname = p.dirname.split('assets').pop();
    };
    const markupPath = p => {
        if (p.extname === '.css') {
            p.dirname = config.dest.style.split(config.dest.markup).pop();
        }
    };

    // PORT setup:
    let port = config.port.proxy;

    // let node_env = process.env.hasOwnProperty('NODE_ENV')
    //     ? process.env.NODE_ENV
    //     : 'development';

    const PORT_VAR = op.get(process.env, 'PORT_VAR', 'APP_PORT');
    if (PORT_VAR && op.has(process.env, [PORT_VAR])) {
        port = op.get(process.env, [PORT_VAR], port);
    } else {
        port = op.get(process.env, ['PORT'], port);
    }

    port = parseInt(port);

    // Update config from environment variables
    config.port.proxy = port;

    // Update config from environment variables
    config.port.browsersync = Number(
        op.get(process.env, 'BROWSERSYNC_PORT', config.port.browsersync),
    );

    const noop = done => done();

    const watcher = e => {
        // let src = path.relative(path.resolve(__dirname), e.path);
        let ePathRelative = path.relative(path.resolve(config.src.app), e.path);
        let fpath = path.resolve(
            rootPath,
            `${config.dest.dist}/${ePathRelative.replace(
                /^.*?\/assets/,
                'assets',
            )}`,
        );

        let displaySrc = path.relative(rootPath, e.path);
        let displayDest = path.relative(rootPath, fpath);

        if (fs.existsSync(fpath)) {
            del.sync([fpath]);
        }

        if (e.event !== 'unlink') {
            const destPath = path.dirname(fpath);
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }

            fs.createReadStream(e.path)
                .pipe(fs.createWriteStream(fpath))
                .on('error', error => console.error(error));
        }

        console.log(`File ${e.event}: ${displaySrc} -> ${displayDest}`);
    };

    const _opnWrapperMonkeyPatch = open =>
        function(url, name, bs) {
            const app = op.get(
                process.env,
                'BROWERSYNC_OPEN_BROWSER',
                'chrome',
            );
            let browser = open.apps.chrome;
            if (app in open.apps) browser = open.apps[app];

            open(url, { app: { name: browser } }).catch(function() {
                bs.events.emit('browser:error');
            });
        };

    const serve = ({ open } = { open: config.open }) => done => {
        const proxy = `127.0.0.1:${config.port.proxy}`;

        // monkey-path opnWrapper for linux support
        const open = require('open');
        const utils = require('browser-sync/dist/utils');
        utils.opnWrapper = _opnWrapperMonkeyPatch(open);

        axios.get(`http://${proxy}`).then(() => {
            browserSync({
                notify: false,
                timestamps: false,
                port: config.port.browsersync,
                ui: { port: config.port.browsersync + 1 },
                proxy,
                open: open,
                ghostMode: false,
                startPath: config.dest.startPath,
                ws: true,
            });

            done();
        });
    };

    const watch = (done, restart = false) => {
        let watchProcess = fork(path.resolve(__dirname, './gulp.watch.js'), {
            env: process.env,
            stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        });
        watchProcess.send({ config, webpackConfig, restart });
        watchProcess.on('message', message => {
            switch (message) {
                case 'build-started': {
                    console.log("Starting 'build'...");
                    done();
                    return;
                }
                case 'restart-watches': {
                    console.log('Waiting for server...');
                    new Promise(resolve =>
                        setTimeout(resolve, config.serverRetryDelay),
                    )
                        .then(() => {
                            const proxy = `127.0.0.1:${config.port.proxy}`;
                            return axios.get(`http://${proxy}`);
                        })
                        .then(() => {
                            console.log("Restarting 'watch'...");
                            watchProcess.kill();
                            watch(_ => _, true);
                        })
                        .catch(error => console.error(error));
                    return;
                }
            }
        });
    };

    const command = (
        cmd,
        args = [],
        done,
        { stdin = 'ignore', stdout = 'inherit', stderr = 'inherit' } = {},
    ) => {
        const ps = spawn(cmd, args, { stdio: [stdin, stdout, stderr] });
        ps.on('close', code => {
            if (code !== 0) console.log(`Error executing ${cmd}`);
            done();
        });

        return ps;
    };

    const local = async done => {
        const crossEnvModulePath = path.resolve(
            path.dirname(require.resolve('cross-env')),
            '..',
        );
        const crossEnvPackage = require(path.resolve(
            crossEnvModulePath,
            'package.json',
        ));
        const crossEnvBin = path.resolve(
            crossEnvModulePath,
            crossEnvPackage.bin['cross-env'],
        );

        await gulp.task('domainsManifest')(() => Promise.resolve());
        await gulp.task('mainManifest')(() => Promise.resolve());

        command('node', [crossEnvBin, 'NODE_ENV=development', 'gulp'], done);

        command(
            'node',
            [crossEnvBin, 'NODE_ENV=development', 'nodemon', './src/index.mjs'],
            done,
            { stdin: 'inherit' },
        );
    };

    const assets = () =>
        gulp
            .src(config.src.assets)
            .pipe(rename(assetPath))
            .pipe(gulp.dest(config.dest.assets));

    const generateParallel = (arr = []) => {
        return gulp.parallel(
            ...arr.map(t => {
                if (typeof t === 'string') {
                    return task(t);
                } else if (Array.isArray(t)) {
                    return generateSeries(t);
                }
            }),
        );
    };

    const generateSeries = (arr = []) => {
        return gulp.series(
            ...arr.map(t => {
                if (typeof t === 'string') {
                    return task(t);
                } else if (Array.isArray(t)) {
                    return generateParallel(t);
                }
            }),
        );
    };

    const build = cfg => {
        const series = cfg.buildTasks || [
            'preBuild',
            'ensureReactiumModules',
            'clean',
            'manifest',
            ['markup', 'json'],
            ['assets', 'styles'],
            'scripts',
            'umdLibraries',
            'serviceWorker',
            'compress',
            'postBuild',
        ];

        Hook.runSync('build-series', series);

        return generateSeries(series);
    };

    const apidocs = done => {
        if (!isDev) done();

        const arcliBin = path.resolve(
            path.dirname(require.resolve('reactium')),
            'arcli.js',
        );
        const args = [
            arcliBin,
            'docs',
            '-s',
            config.docs.src,
            '-d',
            config.docs.dest,
        ];

        const verbose = config.docs.verbose || process.env.VERBOSE_API_DOCS;
        if (verbose) args.push('-V');
        command('node', args, done);
    };

    const clean = done => {
        // Remove build files
        del.sync([config.dest.dist]);
        done();
    };

    const ensureReactiumModules = done => {
        fs.ensureDirSync(config.src.reactiumModules);
        done();
    };

    const defaultTask = env === 'development' ? task('watch') : task('build');

    const json = () =>
        gulp.src(config.src.json).pipe(gulp.dest(config.dest.build));

    const manifest = gulp.series(
        gulp.parallel(
            gulp.series(task('domainsManifest'), task('mainManifest')),
            task('externalsManifest'),
            task('umdManifest'),
        ),
    );

    const umd = gulp.series(task('umdManifest'), task('umdLibraries'));

    const sw = gulp.series(task('umd'), task('serviceWorker'));

    const domainsManifest = done => {
        // Generate domains.js file
        regenManifest({
            manifestFilePath: config.src.domainManifest,
            manifestConfig: reactiumConfig.manifest.domains,
            manifestTemplateFilePath: path.resolve(
                __dirname,
                'manifest/templates/domains.hbs',
            ),
            manifestProcessor: require('./manifest/processors/domains'),
        });

        done();
    };

    const mainManifest = done => {
        // Generate manifest.js file
        regenManifest({
            manifestFilePath: config.src.manifest,
            manifestConfig: reactiumConfig.manifest,
            manifestTemplateFilePath: path.resolve(
                __dirname,
                'manifest/templates/manifest.hbs',
            ),
            manifestProcessor: require('./manifest/processors/manifest'),
        });

        done();
    };

    const externalsManifest = done => {
        // Generate manifest.js file
        regenManifest({
            manifestFilePath: config.src.externalsManifest,
            manifestConfig: reactiumConfig.manifest,
            manifestTemplateFilePath: path.resolve(
                __dirname,
                'manifest/templates/externals.hbs',
            ),
            manifestProcessor: require('./manifest/processors/externals'),
        });
        done();
    };

    const umdManifest = done => {
        // Generate manifest all all umd libraries
        regenManifest({
            manifestFilePath: config.umd.manifest,
            manifestConfig: reactiumConfig.manifest.umd,
            manifestTemplateFilePath: path.resolve(
                __dirname,
                'manifest/templates/umd.hbs',
            ),
            manifestProcessor: require('./manifest/processors/umd'),
        });
        done();
    };

    const markup = () =>
        gulp
            .src(config.src.markup)
            .pipe(rename(markupPath))
            .pipe(gulp.dest(config.dest.markup));

    const scripts = done => {
        // Compile js
        if (!isDev || process.env.MANUAL_DEV_BUILD === 'true') {
            webpack(webpackConfig, (err, stats) => {
                if (err) {
                    console.error(err.stack || err);
                    if (err.details) {
                        console.error(err.details);
                    }

                    done();
                    return;
                }

                const info = stats.toJson();
                if (stats.hasErrors()) {
                    console.error(info.errors);
                    done();
                    return;
                }

                if (stats.hasWarnings()) {
                    if (process.env.DEBUG === 'on') console.warn(info.warnings);
                }

                const mainEntryAssets = _.pluck(
                    info.namedChunkGroups.main.assets,
                    'name',
                );
                Hook.runSync(
                    'main-webpack-assets',
                    mainEntryAssets,
                    info,
                    stats,
                );
                const serverAppPath = path.resolve(rootPath, 'src/app/server');

                fs.ensureDirSync(serverAppPath);
                fs.writeFileSync(
                    path.resolve(serverAppPath, 'webpack-manifest.json'),
                    JSON.stringify(mainEntryAssets),
                    'utf-8',
                );

                done();
            });
        } else {
            done();
        }
    };

    const umdLibraries = async done => {
        let umdConfigs = [];
        try {
            umdConfigs = JSON.parse(
                fs.readFileSync(config.umd.manifest, 'utf8'),
            );
        } catch (error) {
            console.log(error);
        }

        for (let umd of umdConfigs) {
            try {
                console.log(`Generating UMD library ${umd.libraryName}`);
                await new Promise((resolve, reject) => {
                    webpack(umdWebpackGenerator(umd), (err, stats) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        let result = stats.toJson();
                        if (result.errors.length > 0) {
                            result.errors.forEach(error => {
                                console.log(error);
                            });

                            reject(result.errors);
                            return;
                        }

                        resolve();
                    });
                });
            } catch (error) {
                console.log('error', error);
            }
        }

        done();
    };

    // Stub serviceWorker task. Implementation moved to @atomic-reactor/reactium-service-worker plugin
    const serviceWorker = () => Promise.resolve();

    const staticTask = task('static:copy');

    const staticCopy = done => {
        // Copy static files
        fs.copySync(config.dest.dist, config.dest.static);
        done();
    };

    const fileToDataURL = async file => {
        const type = mime.lookup(file);
        const buffer = await fs.readFile(file);
        return `data:${type};base64,${buffer.toString('base64')}`;
    };

    const pluginAssetsTemplate = data => {
        const template = handlebars.compile(`
// 
// DO NOT EDIT!
// This file is generated by gulp styles:pluginAssets task.
//
@use "sass:map";

$assets: () !default;

{{#each this}}
$assets: map.set($assets, "{{key}}", "{{{dataURL}}}");
{{/each}}
`);

        return template(data);
    };

    const pluginAssets = async done => {
        const files = globby.sync(config.src.pluginAssets);
        for (const file of files) {
            const manifest = path.resolve(file);
            const base = path.dirname(manifest);
            try {
                let assets = fs.readFileSync(manifest);
                assets = JSON.parse(assets);

                const entries = Object.entries(assets);
                const mappings = [];
                for (const entry of entries) {
                    const [key, fileName] = entry;
                    const dataURL = await fileToDataURL(
                        path.resolve(base, fileName),
                    );
                    mappings.push({ key, dataURL });
                }

                fs.writeFileSync(
                    path.resolve(base, '_reactium-style-variables.scss'),
                    pluginAssetsTemplate(mappings),
                    'utf8',
                );
            } catch (error) {
                console.error(
                    'error generating sass partial _reactium-style-variables.scss in ' +
                        base,
                    error,
                );
            }
        }

        done();
    };

    const sassPartialPreRegistrations = SassPartial => {
        SassPartial.register('mixins-dir', {
            pattern: /mixins?\/_reactium-style/,
            exclude: false,
            priority: Enums.style.MIXINS,
        });

        SassPartial.register('mixins-ddd', {
            pattern: /_reactium-style-mixins?/,
            exclude: false,
            priority: Enums.style.MIXINS,
        });

        SassPartial.register('variables-dir', {
            pattern: /variables?\/_reactium-style/,
            exclude: false,
            priority: Enums.style.VARIABLES,
        });

        SassPartial.register('variables-ddd', {
            pattern: /_reactium-style-variables?/,
            exclude: false,
            priority: Enums.style.VARIABLES,
        });

        SassPartial.register('base-dir', {
            pattern: /base\/_reactium-style/,
            exclude: false,
            priority: Enums.style.BASE,
        });

        SassPartial.register('base-ddd', {
            pattern: /_reactium-style-base/,
            exclude: false,
            priority: Enums.style.BASE,
        });

        SassPartial.register('atoms-dir', {
            pattern: /atoms?\/_reactium-style/,
            exclude: false,
            priority: Enums.style.ATOMS,
        });

        SassPartial.register('atoms-ddd', {
            pattern: /_reactium-style-atoms?/,
            exclude: false,
            priority: Enums.style.ATOMS,
        });

        SassPartial.register('molecules-dir', {
            pattern: /molecules?\/_reactium-style/,
            exclude: false,
            priority: Enums.style.MOLECULES,
        });

        SassPartial.register('molecules-ddd', {
            pattern: /_reactium-style-molecules?/,
            exclude: false,
            priority: Enums.style.MOLECULES,
        });

        SassPartial.register('organisms-dir', {
            pattern: /organisms?\/_reactium-style/,
            exclude: false,
            priority: Enums.style.ORGANISMS,
        });

        SassPartial.register('organisms-ddd', {
            pattern: /_reactium-style-organisms?/,
            exclude: false,
            priority: Enums.style.ORGANISMS,
        });

        SassPartial.register('overrides-dir', {
            pattern: /overrides?\/_reactium-style/,
            exclude: false,
            priority: Enums.style.OVERRIDES,
        });

        SassPartial.register('overrides-ddd', {
            pattern: /_reactium-style-overrides?/,
            exclude: false,
            priority: Enums.style.OVERRIDES,
        });
    };

    const dddStylesPartial = done => {
        const SassPartialRegistry = registryFactory(
            'SassPartialRegistry',
            'id',
            Registry.MODES.CLEAN,
        );

        sassPartialPreRegistrations(SassPartialRegistry);
        Hook.runSync('ddd-styles-partial', SassPartialRegistry);

        const template = handlebars.compile(`
// WARNING: Do not directly edit this file !!!!
// File generated by gulp styles:partials task

{{#each this}}
@import '{{ this }}';
{{/each}}
`);

        const styleDDD = [config.src.styleDDD];

        Hook.runSync('ddd-styles-partial-glob', styleDDD);

        const stylePartials = globby
            .sync(_.flatten(styleDDD))
            .map(partial => {
                if (/^reactium_modules\//.test(partial)) {
                    return partial.replace('reactium_modules/', '+');
                }

                return path
                    .relative(
                        path.dirname(config.dest.modulesPartial),
                        path.resolve(rootPath, partial),
                    )
                    .split(/[\\\/]/g)
                    .join(path.posix.sep);
            })
            .map(partial => partial.replace(/\.scss$/, ''))
            .map(partial => {
                const match =
                    SassPartialRegistry.list.find(({ pattern }) =>
                        pattern.test(partial),
                    ) || {};
                return {
                    partial,
                    match,
                    output: op.get(match, 'output', config.dest.modulesPartial),
                };
            })
            .filter(({ match }) => !op.get(match, 'exclude', false));

        Object.entries(_.groupBy(stylePartials, 'output')).forEach(
            ([output, partials]) => {
                // sort by directory basename
                const stylePartials = partials
                    .sort(({ partial: a }, { partial: b }) => {
                        const aBase = path
                            .basename(path.dirname(a))
                            .toLocaleLowerCase();
                        const bBase = path
                            .basename(path.dirname(b))
                            .toLocaleLowerCase();
                        if (aBase > bBase) return 1;
                        if (aBase < bBase) return -1;
                        return 0;
                    })
                    // sort by file basename
                    .sort(({ partial: a }, { partial: b }) => {
                        const aBase = path.basename(a).toLocaleLowerCase();
                        const bBase = path.basename(b).toLocaleLowerCase();
                        if (aBase > bBase) return 1;
                        if (aBase < bBase) return -1;
                        return 0;
                    })
                    // sort by numbers found in basename
                    .sort(({ partial: a }, { partial: b }) => {
                        const aBase = path.basename(a).toLocaleLowerCase();
                        const bBase = path.basename(b).toLocaleLowerCase();
                        const aNumber = aBase.match(/(\d+)/) || 0;
                        const bNumber = bBase.match(/(\d+)/) || 0;
                        if (aNumber > bNumber) return 1;
                        if (aNumber < bNumber) return -1;
                        return 0;
                    })
                    // sort by priority
                    .sort(({ match: a }, { match: b }) => {
                        const aPriority = op.get(
                            a,
                            'priority',
                            Enums.style.ORGANISMS,
                        );
                        const bPriority = op.get(
                            b,
                            'priority',
                            Enums.style.ORGANISMS,
                        );

                        if (aPriority > bPriority) return 1;
                        else if (bPriority > aPriority) return -1;
                        return 0;
                    });

                const currentPartial =
                    fs.existsSync(output) && fs.readFileSync(output, 'utf8');

                const newPartial = template(
                    stylePartials.map(({ partial }) => partial),
                );
                if (currentPartial !== newPartial) {
                    fs.ensureFileSync(output);
                    fs.writeFileSync(output, newPartial, 'utf8');
                }
            },
        );

        done();
    };

    const colorTemplate = (data, src) => {
        const template = handlebars.compile(`
// 
// DO NOT EDIT!
// This file is generated by gulp styles:colors task.
// Modify ${src} in this directory to effect this file.
//
@use "sass:map";

{{#each this}}
\${{{ key }}}: {{{value}}} !default;
{{/each}}

$color: () !default;

{{#each this}}
$color: map.set($color, "{{key}}", \${{{ key }}});
{{/each}}
`);
        return template(data);
    };

    const stylesColors = done => {
        const colorProfiles = globby.sync(config.src.colors);

        if (colorProfiles.length > 0) {
            colorProfiles.forEach(filePath => {
                const profile = fs.readJsonSync(path.resolve(filePath));
                const location = path.dirname(filePath);
                const { name } = path.parse(path.basename(filePath));
                let [, prefix = 'variables', ...suffixParts] = name.split('-');

                const prefixes = [
                    'mixins',
                    'variables',
                    'base',
                    'atoms',
                    'molecules',
                    'organisms',
                    'overrides',
                ];
                Hook.runSync('color-profile-prefixes', prefixes);

                if (!prefixes.includes(prefix)) {
                    suffixParts = [prefix].concat(suffixParts);
                    prefix = 'variables';
                }

                const suffix = suffixParts.join('-');
                const outputFileName = `_reactium-style-${prefix}-colors${
                    suffix.length > 0 ? `-${suffix}` : ''
                }.scss`;
                const outputPath = path.resolve(location, outputFileName);

                const colorFileContents = colorTemplate(
                    Object.entries(profile).map(([key, value]) => ({
                        key,
                        value,
                    })),
                    path.basename(filePath),
                );

                fs.writeFileSync(outputPath, colorFileContents, 'utf8');
            });
        }

        done();
    };

    const stylesCompile = () => {
        return gulp
            .src(config.src.style)
            .pipe(gulpif(isDev, sourcemaps.init()))
            .pipe(
                sass({
                    importer: reactiumImporter,
                    includePaths: config.src.includes,
                }).on('error', sass.logError),
            )
            .pipe(prefix(config.browsers))
            .pipe(gulpif(!isDev, cleanCSS()))
            .pipe(gulpif(isDev, sourcemaps.write()))
            .pipe(rename({ dirname: '' }))
            .pipe(gulp.dest(config.dest.style))
            .pipe(gulpif(isDev, browserSync.stream()));
    };

    const getStyleSeries = () => {
        const series = [
            'styles:colors',
            'styles:pluginAssets',
            'styles:partials',
            'styles:compile',
        ];

        Hook.runSync('style-series', series);

        return series;
    };

    const styles = generateSeries(getStyleSeries());

    const compress = done =>
        isDev
            ? done()
            : gulp
                  .src(config.src.compress)
                  .pipe(gzip())
                  .pipe(gulp.dest(config.dest.assets));

    const watchFork = done => {
        const style = [config.watch.style];
        const styleDDD = [config.src.styleDDD];

        Hook.runSync('ddd-styles-glob', style);
        Hook.runSync('ddd-styles-partial-glob', styleDDD);

        const watchers = {};

        // Watch for file changes
        watchers['manifest'] = gulp.watch(
            config.watch.js,
            gulp.task('manifest'),
        );

        watchers['styles:colors'] = gulp.watch(
            config.watch.colors,
            gulp.task('styles:colors'),
        );
        watchers['styles:pluginAssets'] = gulp.watch(
            config.watch.pluginAssets,
            gulp.task('styles:pluginAssets'),
        );
        watchers['styles:compile'] = gulp.watch(
            _.flatten(style),
            gulp.task('styles:compile'),
        );
        watchers['styles:partials'] = gulp.watch(
            _.flatten(styleDDD),
            gulp.task('styles:partials'),
        );
        gulpwatch(config.watch.markup, watcher);
        gulpwatch(config.watch.assets, watcher);

        watchLogger(watchers);
        done();
    };

    const watchLogger = watchers => {
        Object.entries(watchers).forEach(([type, watcher]) => {
            [
                ['change', chalk.green(`[${type} change]`)],
                ['add', chalk.green(`[${type} add]`)],
                ['unlink', chalk.green(`[${type} delete]`)],
            ].forEach(([eventName, label]) => {
                watcher.on(eventName, changed => {
                    console.log(label, changed);
                });
            });
        });
    };

    const tasks = {
        apidocs,
        local,
        assets,
        preBuild: noop,
        build: build(config),
        compress,
        postBuild: noop,
        postServe: noop,
        clean,
        ensureReactiumModules,
        default: defaultTask,
        json,
        manifest,
        domainsManifest,
        mainManifest,
        externalsManifest,
        umd,
        umdManifest,
        umdLibraries,
        markup,
        scripts,
        serve: serve(),
        'serve-restart': serve({ open: false }),
        serviceWorker,
        sw,
        static: staticTask,
        'static:copy': staticCopy,
        'styles:partials': dddStylesPartial,
        'styles:pluginAssets': pluginAssets,
        'styles:colors': stylesColors,
        'styles:compile': stylesCompile,
        styles,
        watch,
        watchFork,
    };

    let tasksOverride = _ => _;
    if (fs.existsSync(`${rootPath}/gulp.tasks.override.js`)) {
        tasksOverride = require(`${rootPath}/gulp.tasks.override.js`);
    }

    return tasksOverride(tasks, config);
};

module.exports = reactium;
