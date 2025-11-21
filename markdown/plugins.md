# Plugin API

Reactium has a number of features that make it a plugable React application framework. Instead of monolithically composed applications
that can only be maintained by one group of developers, with Reactium, it is possible to compose your
application to be extensible with plugin modules. The key features of the Reactium Plugin API provided by the Reactium SDK:

-   Asynchronous Hooks to bind into your application
-   Dynamic Component Rendering Zones
-   Front-end runtime caching for improved data loading
-   Front-end `Pulse` task runner
-   Component registration for easy externalization
-   Imperative handle registration for easy communication between components
-   Helpful SDK features for interacting with the plugable node/express back-end partner of Reactium, `Actinium`.
-   Internal or UMD plugin module development workflow and registration

Many of the [SDK's core features](https://atomic-reactor.github.io/reactium-sdk-core/) can be even be used on non-Reactium projects.

## Component Rendering Zones

Reactium comes with the built-in concept of **zones.** Component zones are just
React components themselves. Component rendering zones are used to dynamically gather components
at runtime designated at that zone, and render them as children.

Zones are a helpful pattern for when you do not want to hard-code the composition of your application, often because you can't or shouldn't update each large component manually, or you want to provide dynamic composition (not just data).

### Scenario

For example, I have an admin UI that specifies a generic layout with a **navigation** zone, a **footer** zone, a content **zone**, and a **sidebar** zone.

```js
import React from 'react';

export default class Template extends React {
    render() {
        return (
            <main>
                <section className='navigation' />

                <section className='content'>{this.props.children}</section>

                <aside className='sidebar' />

                <section className='footer' />
            </main>
        );
    }
}
```

Great, now I have a template that I can use to create a page, and I can pass the children components for the content zone. But wait, what if I want to load different components into the **navigation**, **sidebar**, or **footer** zones.

Well, maybe I'll conditionally load different navigation, different sidebar content, etc. No problem, except anyone who has done this has seen a template component like this get out of hand.

```js
import React from 'react';
import HomeNavigation from 'components/navs/HomeNavigation';
import ArticleNavigation from 'components/navs/ArticleNavigation';
import BlogNavigation from 'components/navs/BlogNavigation';
import HomeSidebar from 'components/sidebars/HomeSidebar';
import ArticleSidebar from 'components/sidebars/ArticleSidebar';
import BlogSidebar from 'components/sidebars/BlogSidebar';
import HomeFooter from 'components/footers/HomeFooter';
import ArticleFooter from 'components/footers/ArticleFooter';
import BlogFooter from 'components/footers/BlogFooter';

export default class Template extends React {
    renderNav() {
        switch (this.props.pageType) {
            case 'home':
                return <HomeNavigation />;
            case 'article':
                return <ArticleNavigation />;
            case 'blog':
                return <BlogNavigation />;
        }
    }

    renderSidebar() {
        switch (this.props.pageType) {
            case 'home':
                return <HomeSidebar />;
            case 'article':
                return <ArticleSidebar />;
            case 'blog':
                return <BlogSidebar />;
        }
    }

    renderFooter() {
        switch (this.props.pageType) {
            case 'home':
                return <HomeFooter />;
            case 'article':
                return <ArticleFooter />;
            case 'blog':
                return <BlogFooter />;
        }
    }

    render() {
        return (
            <main>
                <section className='navigation'>{this.renderNav()}</section>

                <section className='content'>{this.props.children}</section>

                <aside className='sidebar'>{this.renderSidebar()}</aside>

                <section className='footer'>{this.renderFooter()}</section>
            </main>
        );
    }
}
```

> Gah! I don't want this import list to get any longer. Also, this is feeling pretty fragile and inflexible too.

There are patterns to "clean" this up. We can extract these zones into new components, create separate templates, but somewhere there is going to be a bunch of imperative code or I'm going to have to repeat myself.

### Zone Solution

Enter Reactium **Zone**. This is where Reactium plugin zones can help make your composition more dynamic, and let you accomplish something like this in a more declarative way.

Let's start by defining plugin zones with the SDK's `<Zone />` component.

```js
import React from 'react';
import { Zone } from 'reactium-core/sdk';

export default class Template extends React {
    render() {
        return (
            <main>
                <section className='navigation'>
                    <Zone zone='navigation' />
                </section>

                <section className='content'>
                    <Zone zone='content-pre' />
                    {this.props.children}
                    <Zone zone='content-post' />
                </section>

                <aside className='sidebar'>
                    <Zone zone='sidebar' />
                </aside>

                <section className='footer'>
                    <Zone zone='footer' />
                </section>
            </main>
        );
    }
}
```

Now that we've defined the zones for our layout, let's add our existing `HomeNavigation` component to the `navigation` zone.

Within our `components/HomeNavigation` directory, we will create a **plugin.js** file like so:

```js
import HomeNavigation from './index';

export default {
    /**
     * Required - used as rendering key. Make this unique.
     * @type {String}
     */
    id: 'home-page-main-navigation',

    /**
     * By default components in zone are rendering in ascending order.
     * @type {Number}
     */
    order: 0,

    /**
     * One or more zones this component should render.
     * @type {String|Array}
     */
    zone: 'navigation',

    /**
     * Component to render. May also be a string, and
     * the component will be looked up in components directory.
     * @type {Component|String}
     */
    component: HomeNavigation,

    /**
     * (Optional) additional search subpaths to use to find the component,
     * if String provided for component property.
     * @type {[type]}
     *
     * e.g. If component is a string 'TextInput', uncommenting the line below would
     * look in components/common-ui/form/inputs and components/general to find the component 'TextInput'
     */
    // paths: ['common-ui/form/inputs', 'general']

    /**
     * Additional params: (optional)
     *
     * Any additional properties you provide below, will be provided as params to the component when rendered.
     *
     * e.g. Below will be provided to the HomeNavigation, <HomeNavigation pageType="home" />
     * These can also be used to help sort or filter zone components.
     * @type {Mixed}
     */
    pageType: 'home',
};
```

### Command Line Help

After you've defined the zones for your layout, you can use the CLI to scan those zones using the command:

```sh
arcli zones scan
```

> (Optional) This isn't strictly necessary, but it will help you use the CLI to create plugin components later.

Alternatively, you can manually register your zones with the cli (helpful for dynamic zones, i.e. zone property is provided by variable).

```sh
arcli zones add -i "navigation" -d "Navigation zone in template"
arcli zones add -i "content-pre" -d "Before Content in template"
arcli zones add -i "content-pre" -d "After Content in template"
arcli zones add -i "sidebar" -d "Sidebar zone in template"
arcli zones add -i "content-pre" -d "Footer zone in template"
```

> (Optional) Again, this just helps speed up your workflow with the CLI when creating new zone components.

For existing components, you can add the `plugin.js` file to register it to a component `Zone`, by using:

```sh
arcli plugin component
```

## Hooks

Reactium provides a powerful asynchronous hook system that allows plugins to bind into your application at specific points in the lifecycle. Hooks enable plugins to extend, modify, or react to framework behavior without directly modifying core code.

### Registering Hooks

Hooks are registered using the `Reactium.Hook.register()` method:

```js
import Reactium from 'reactium-core/sdk';

Reactium.Hook.register(
    'plugin-init',
    async context => {
        // Your hook implementation
        console.log('Plugin initialized!');
    },
    Reactium.Enums.priority.highest,
);
```

### Hook Parameters

- **hookName** (String): The name of the hook to register
- **callback** (Function): The function to execute when the hook is called
- **priority** (Number): Optional execution order (lower numbers run first)
- **id** (String): Optional unique identifier for the hook

### Common Hook Names

- `plugin-dependencies`: Register plugin dependencies before initialization
- `plugin-init`: Initialize plugins
- `routes-init`: Register or modify routes
- `component-bindings-init`: Register component bindings
- `zone-defaults`: Set default zone components
- `app-bindpoint`: Modify the React app before rendering

### Priority Levels

```js
Reactium.Enums.priority.highest; // -1000 (runs first)
Reactium.Enums.priority.high; // -500
Reactium.Enums.priority.neutral; // 0 (default)
Reactium.Enums.priority.low; // 500
Reactium.Enums.priority.lowest; // 1000 (runs last)
Reactium.Enums.priority.core; // -2000 (framework core - DO NOT USE)
```

### Executing Hooks

Most hooks are executed by the framework automatically, but you can also execute custom hooks:

```js
// Execute async hooks
await Reactium.Hook.run('my-custom-hook', context);

// Execute sync hooks
Reactium.Hook.runSync('my-sync-hook', context);
```

### Hook Context

Many hooks receive a context object that can be modified. For example, the `routes-init` hook receives route configuration that your plugin can augment.

See the [Reactium SDK documentation](https://atomic-reactor.github.io/reactium-sdk-core/) for complete hook API reference.

## Component Registration

Reactium provides a Component Registry that allows you to register React components by name, making them available throughout your application without direct imports. This enables plugin-based architecture where components can be replaced or extended.

### Registering Components

Register a component using `Reactium.Component.register()`:

```js
import Reactium from 'reactium-core/sdk';
import MyButton from './MyButton';

Reactium.Component.register('MyButton', MyButton);
```

### Using Registered Components

Use the `<HookComponent />` component or `useHookComponent` hook to consume registered components:

```js
import React from 'react';
import { HookComponent, useHookComponent } from 'reactium-core/sdk';

// Using HookComponent
export default () => (
    <div>
        <HookComponent type="MyButton" label="Click Me" />
    </div>
);

// Using useHookComponent hook
export default () => {
    const MyButton = useHookComponent('MyButton');
    return (
        <div>
            <MyButton label="Click Me" />
        </div>
    );
};
```

### Component Override

Components can be replaced by re-registering with the same name. The last registered component wins:

```js
import CustomButton from './CustomButton';

// Override the default MyButton
Reactium.Component.register('MyButton', CustomButton);
```

### Auto-Discovery

Components in your `src/app/components` directory with a `reactium-component-*.js` file will be automatically discovered and registered during the build process.

Example `reactium-component-MyButton.js`:

```js
import MyButton from './index';

export default {
    id: 'MyButton',
    component: MyButton,
};
```

## Handles

Handles provide a way to create imperative APIs for React components that can be accessed from anywhere in your application. They're especially useful for shared state management and cross-component communication.

### Creating a Handle

Use the `useRegisterHandle` hook to create a handle:

```js
import React from 'react';
import { useRegisterHandle } from 'reactium-core/sdk';

export default () => {
    const [count, setCount] = React.useState(0);

    useRegisterHandle(
        'MyCounter',
        () => ({
            get count() {
                return count;
            },
            increment: () => setCount(count + 1),
            decrement: () => setCount(count - 1),
            reset: () => setCount(0),
        }),
        [count],
    );

    return <div>Count: {count}</div>;
};
```

### Using Handles

Access handles from other components using `useHandle`:

```js
import React from 'react';
import { useHandle } from 'reactium-core/sdk';

export default () => {
    const MyCounter = useHandle('MyCounter');

    if (!MyCounter) return null;

    return (
        <div>
            <p>Current count: {MyCounter.count}</p>
            <button onClick={MyCounter.increment}>+</button>
            <button onClick={MyCounter.decrement}>-</button>
            <button onClick={MyCounter.reset}>Reset</button>
        </div>
    );
};
```

### Sync Handles

For handles that manage state, use `useRegisterSyncHandle` which provides built-in state synchronization:

```js
import { useRegisterSyncHandle } from 'reactium-core/sdk';

export default () => {
    useRegisterSyncHandle('MyData', () => ({
        items: [],
        loading: false,
    }));

    // Component implementation
};
```

Consume sync handles with `useSelectHandle` for reactive updates:

```js
import { useSelectHandle } from 'reactium-core/sdk';

export default () => {
    const items = useSelectHandle('MyData', state => state.items);

    return (
        <ul>
            {items.map(item => (
                <li key={item.id}>{item.name}</li>
            ))}
        </ul>
    );
};
```

## Plugin Modules

Plugin modules are standalone UMD (Universal Module Definition) JavaScript bundles that extend Reactium. They're designed for dynamic loading and can be delivered independently from your main application bundle.

### When to Use Plugin Modules

Plugin modules are ideal for:

- Admin panel extensions
- Feature modules that can be enabled/disabled
- Third-party extensions
- Code that should load after the main application

### Creating a Plugin Module

Create a plugin module using the CLI:

```bash
arcli plugin module
```

This creates a plugin structure in `src/app/components/plugin-src/[name]`:

```
customer/
├── assets/
│   └── style/
│       └── customer-plugin.scss
├── index.js              # Main plugin code
├── reactium-hooks.js     # Development binding
├── umd-config.json       # Build configuration
└── umd.js                # UMD entry point
```

### Plugin Registration

Your plugin must register itself when loaded:

```js
// index.js
import Reactium from 'reactium-core/sdk';

Reactium.Plugin.register('customer', Reactium.Enums.priority.neutral).then(
    () => {
        console.log('Customer plugin loaded');

        // Register hooks, components, etc.
        Reactium.Hook.register('plugin-ready', async () => {
            // Your plugin initialization
        });
    },
);
```

### Development Mode

During development, uncomment `reactium-hooks.js` to load your plugin locally:

```js
import Reactium from 'reactium-core/sdk';

Reactium.Hook.register(
    'plugin-dependencies',
    async () => {
        Reactium.Plugin.unregister('customer');
        require('./index'); // Load local version
    },
    Reactium.Enums.priority.highest,
);
```

### Building Plugin Modules

Build your plugin module:

```bash
arcli plugin build
```

This generates UMD bundle and CSS in `.cli/plugins/[name]/`

### Ejecting to Backend

Deploy plugin assets to Actinium backend:

```bash
arcli plugin eject
```

Follow prompts to select target directory. Assets are copied to backend plugin for delivery via API.

See [Plugin Module Documentation](./plugins/modules.md) for complete details.

## Actinium Extensions

When building full-stack applications with Actinium backend, Reactium provides built-in utilities for API communication and integration.

### Parse SDK Integration

Reactium includes the Parse JavaScript SDK for seamless Actinium communication:

```js
import Reactium from 'reactium-core/sdk';

// Access Parse SDK
const Parse = Reactium.Parse;

// Query data
const query = new Parse.Query('MyCollection');
const results = await query.find();

// Save data
const MyObject = Parse.Object.extend('MyCollection');
const obj = new MyObject();
obj.set('name', 'Example');
await obj.save();
```

### Cloud Functions

Call Actinium Cloud Functions from Reactium:

```js
import Reactium from 'reactium-core/sdk';

// Call cloud function
const result = await Reactium.Cloud.run('my-function', {
    param1: 'value1',
    param2: 'value2',
});
```

### User Authentication

Reactium integrates with Actinium's user authentication:

```js
import Reactium from 'reactium-core/sdk';

// Login
await Reactium.User.login('username', 'password');

// Get current user
const currentUser = Reactium.User.current();

// Logout
await Reactium.User.logout();

// Check if authenticated
if (Reactium.User.isAuthenticated()) {
    // User is logged in
}
```

### Live Queries

Enable real-time data synchronization with Parse Live Queries:

```js
import Reactium from 'reactium-core/sdk';

const query = new Reactium.Parse.Query('Messages');
const subscription = await query.subscribe();

subscription.on('create', message => {
    console.log('New message:', message);
});

subscription.on('update', message => {
    console.log('Message updated:', message);
});

// Cleanup
subscription.unsubscribe();
```

### API Configuration

Configure Actinium connection in your environment or code:

```js
// In plugin or boot hook
Reactium.Hook.register('sdk-init', () => {
    if (typeof window !== 'undefined') {
        Reactium.Parse.initialize(
            'YOUR_APP_ID',
            'YOUR_JAVASCRIPT_KEY',
        );
        Reactium.Parse.serverURL = 'https://your-actinium-server.com/api';
    }
});
```

For complete integration patterns, see the [Framework Integration Documentation](/home/john/reactium-framework/CLAUDE/FRAMEWORK_INTEGRATION.md).
