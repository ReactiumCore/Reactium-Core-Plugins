import Reactium from 'reactium-core/sdk';
import './storeCreator';
import DevTools from './DevTools';
import Middleware from './sdk/middleware';
import Reducer from './sdk/reducer';

Reactium.Component.register('DevTools', DevTools);
Reactium.Hook.register(
    'app-context-provider',
    async () => {
        const { Provider: ReduxProvider } = await import('react-redux');
        Reactium.Component.register('ReduxProvider', ReduxProvider);

        Reactium.AppContext.register(
            'ReduxProvider',
            {
                provider: ReduxProvider,
                store: Reactium.Redux.store,
            },
            Reactium.Enums.priority.neutral,
        );

        Reactium.Middleware = Middleware;
        Reactium.Reducer = Reducer;

        console.log('Defining Redux Provider.');
    },
    Reactium.Enums.priority.high,
    'REDUX_PROVIDER',
);
