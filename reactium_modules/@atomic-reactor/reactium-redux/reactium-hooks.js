import Reactium from 'reactium-core/sdk';
import './storeCreator';
import DevTools from './DevTools';
import Middleware from './middleware';
import Reducer from './reducer';

Reactium.Component.register('DevTools', DevTools);
Reactium.Hook.register(
    'app-redux-provider',
    async () => {
        Reactium.Component.unregister('ReduxProvider');
        const { Provider } = await import('react-redux');
        Reactium.Component.register('ReduxProvider', Provider);
        console.log('Defining Redux Provider.');
        return Promise.resolve();
    },
    Reactium.Enums.priority.high,
    'REDUX_PROVIDER',
);

Reactium.Middleware = Middleware;
Reactium.Reducer = Reducer;
