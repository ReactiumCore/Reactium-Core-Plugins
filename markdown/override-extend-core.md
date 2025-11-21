# Overriding Core

Reactium is built on a core framework located in `reactium_modules/@atomic-reactor/reactium-core`. The local development and build configuration that comes out of the box is meant to be upgradeable, so long as your application was built off a semver that is minor-version compatible with the current.

Even for larger version steps, we are going to attempt to describe (or automate) much of the migration from one version of Reactium core to another.

Upgrading core is performed with the CLI, btw:

```sh
$ npx reactium update
```

With a number of other front-end frameworks, even those based on React, the philosophy is to entirely hide the local development/build configuration from the developer, sometimes with an **eject** feature to get raw configuration / build files.

Our philosophy is to create a strong opinion for building a React application, from application structure, to out of the box capabilities such as routing, plugins, and state management, while giving the code maintainer, lead-dev, and ops roles on your team the power to replace, augment, or override behaviors of the build.

## Hacking Core

Should you hack core? Short answer is no.

If you modify files in the `reactium_modules/@atomic-reactor/reactium-core/` directory, those changes potentially make your app incompatible with future versions of the framework, and may prevent you from making simple updates. We don't recommend doing this unless you absolutely have to. If you have a good idea for a general purpose patch to core, please fork Reactium on github and send us a pull-request. We'll either add your update if appropriate, or give you an alternative that does not require hacking on core.

That being said, there are a number of build and development overrides built-in to core for your use.

## Override Files

There are a handful of files, that, if they exist in your app's root directory, will automatically be used by core for your build process.

| File (Where)                | Description (How)                                                                                                                                                     | Overrides (What)                                                         | Reason (Why)                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| gulp.config.override.js     | Exports a function that takes core gulp configuration object as a parameter, and returns configuration object used by gulp tasks (and in some cases also by webpack.) | Object returned by reactium-core/gulp.config.js                          | Need to change build src/dest. Local port config.                                        |
| gulp.tasks.override.js      | Exports a function that takes an object defining core gulp tasks as a parameter, and returns and object whose properties define the tasks run by gulp                 | Gulp tasks defined by reactium-core/gulp.tasks.js                        | Add pre or post build tasks. Replace built-in tasks.                                     |
| manifest.config.override.js | Exports a function that takes configuration the manifest-tools use to build src/manifest.js as a parameter, and returns new manifest configuration.                   | Configuration specified by manifest property of reactium-core/reactium-config.js | Add new application dependencies to dependency module. Add new component search context. |
| webpack.override.js         | Exports a function that takes the core webpack configuration as a parameter, and returns an object that will be used for webpack to build the js bundle.              | Configuration object specified by reactium-core/webpack.config.js        | You hate yourself.                                                                       |
| babel.config.js             | **(Required)** Imports babel configuration and exports the configuration used by webpack and babel-node.                                                              | Babel configuration specified by reactium-core/babel.config.js           | Add babel presets / plugins. Add module alias for both server / transpiled front-end.    |

## Node / Express Overrides

Important to dev-leads, ops and backend devs, there are a number of ways you can change the behavior of the core express server without hacking core.

### Express Middleware

To add or change the stack of Node / Express middleware for the running server, create a `src/app/server/middleware.js` file, which should export a function taking an array of express middlewares as an argument, and returns the modified list of middlewares.

In this way, you can add/change routing, security configuration, etc to your hearts content.

See `reactium_modules/@atomic-reactor/reactium-core/index.js` for built-in middlewares list.

#### Express Middleware Examples

A simple logger:

```js
module.exports = expressMiddlewares => {
    const mySimpleRequestLogger = (req, res, next) => {
        console.log(`SIMPLE LOGGER: REQUEST ${req.path}`);
        next();
    };

    return [
        {
            name: 'mySimpleRequestLogger',
            use: mySimpleRequestLogger,
        },
        ...expressMiddlewares,
    ];
};
```

A health check route handler:

```js
const express = require('express');
const router = express.Router();

const healthy = router.get('/healthcheck', (req, res) => {
    res.status(200).send('ok');
});

module.exports = expressMiddlewares => {
    return [
        {
            name: 'myRouteHandler',
            use: router,
        },
        ...expressMiddlewares,
    ];
};
```

More secure Cross Origin Request Sharing for production:

```js
const cors = require('cors');

module.exports = expressMiddlewares => {
    return expressMiddlewares.map(mw => {
        // no change
        if (mw.name !== 'cors' || !('CORS_ORIGIN' in process.env)) {
            return mw;
        }

        // enforce origin
        return {
            name: 'cors',
            use: cors({
                origin: process.env.CORS_ORIGIN,
            }),
        };
    });
};
```

### Override Express SPA Template

The default templates are good for simple SPAs, but inevitably you will need to provide a different template for rendering your application's index.html.

To do so, copy the template files from `reactium_modules/@atomic-reactor/reactium-core/server/template/feo.js` and `reactium_modules/@atomic-reactor/reactium-core/server/template/ssr.js` to `src/app/server/template` to make modifications to the template served by express for your front-end only and server-side rendered SPA, respectively.

**Important**: replace the `%TEMPLATE_VERSION%` string found in those templates with the version number found in `reactium_modules/@atomic-reactor/reactium-core/reactium-config.js` at the time you copy them. Reactium core will use these templates to serve your SPA so long as your src template version string satisfies the `semver` property found in your core reactium.config.js. You may need to update these templates after major and minor version updates of core.

### Static Build Template

There is an `index-static.html` file provided in the `src/` directory, which can be used to compile a static index.html file when running static build: `npm run static`. This is for Reactium applications that will be served by another web-server (Apache / Nginx / Tomcat etc.), and supports only front-end rendered React (not SSR.)

### Application Defines

Node/Express `global.defines` variables can be set by creating a `src/app/server/defines.js` file that exports a javascript object.

The file will also be used in constructing a webpack defines plugin values as well.

Theoretically, your SSR and FE code could make reference to values specified here.

Contrived `src/app/server/defines.js`:

```js
module.exports = {
    foo: 'bar',
};
```

Isomorphic Define JS somewhere in front-end React code:

```js
let fooValue;
if (typeof window !== 'undefined') {
    fooValue = foo; // webpack define plugin
} else {
    fooValue = global.defines.foo;
}
```

### Component Libs (Dynamically loaded front-end modules)

When found in a Reactium `src/component` domain, Reactium core will attempt to add them to the manifest.

See `reactium_modules/@atomic-reactor/reactium-core/reactium-config.js` `defaultLibraryExternals` constant for available external dependencies.

## Front-end Overrides

### Redux Extensions

**Note**: Redux is deprecated in modern Reactium in favor of the Handle system. This section is kept for legacy applications.

When found in a Reactium `src/component` domain, Reactium core will attempt to add them to Redux store construction.

See `reactium_modules/@atomic-reactor/reactium-core/redux/storeCreator.js` for built-in Redux middleware and store enhancers.

#### Example Custom Redux Middleware

```js
// src/app/MyComponent/redux-middleware.js
export default {
    order: 100,
    name: 'myMiddleware',
    middleware: store => next => action => {
        console.log('ACTION:', action.type);
        return next(action);
    },
};
```

## Framework Updates

To update the Reactium core framework:

```sh
npx reactium update
```

This will check for updates and guide you through the upgrade process, including any breaking changes or migration steps needed.
