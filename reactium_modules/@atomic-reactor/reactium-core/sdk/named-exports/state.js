import {
    Handle,
    ReactiumSyncState,
    ComponentEvent,
    Hook,
    Pulse,
} from '@atomic-reactor/reactium-sdk-core';
import { Routing } from '../routing';
import { useEffect, useState } from 'react';
import cc from 'camelcase';
import _ from 'underscore';
import op from 'object-path';

export const State = new ReactiumSyncState(window.state || {});
State.extend('registerDataLoader', (config = {}) => {
    const eventType = op.get(config, 'eventType', 'dataLoaded');

    if (typeof eventType != 'string' || eventType.length === 0) {
        console.warn('Ignoring data loader. Invalid eventType.');
        return;
    }

    const path = op.get(config, 'path', op.get(config, 'domain'));
    if (typeof path != 'string' && !Array.isArray(path)) {
        console.warn(
            'Ignoring data loader. Invalid or missing object path or domain for State.',
        );
        return;
    }

    const callback = op.get(config, 'callback');
    if (typeof callback != 'function') {
        console.warn(
            'Ignoring data loader. callback object must be a function.',
        );
        return;
    }

    const loadAtEntries = Object.entries(
        op.get(config, 'loadAt', {}),
    ).filter(([key]) =>
        ['route', 'hook', 'event', 'pulse', 'suspense'].includes(key),
    );

    const dispatchingDataLoad = async (...context) => {
        try {
            const data = await callback(config, ...context);
            State.set(path, data);
            State.dispatch(eventType, { data, config, context });
        } catch (error) {
            State.dispatch(`${eventType}-error`, { error, config, context });
            console.error(error);
        }
    };

    const dispatchingSuspendingDataLoad = (...context) => {
        let status = 'pending',
            result = callback(config, ...context).then(
                data => {
                    State.set(path, data);
                    State.dispatch(eventType, { data, config, context });
                    result = data;
                    status = 'resolved';
                },
                error => {
                    State.dispatch(`${eventType}-error`, {
                        error,
                        config,
                        context,
                    });
                    console.error(error);
                    status = error;
                },
            );

        return () => {
            if (status === 'pending') throw result;
            else if (status === 'error') throw error;
            else return result;
        };
    };

    // Handle all loadAt option
    if (loadAtEntries.length === 0) loadAtEntries.push(['hook', 'app-ready']); // default to loading on app-ready hook
    loadAtEntries.forEach(([name, value]) => {
        if (name === 'hook' && typeof value == 'string') {
            Hook.register(value, dispatchingDataLoad);
        } else if (name === 'route') {
            Routing.routeListeners.register('loadState', {
                handler: async updates => {
                    const currentPath = op.get(
                        updates,
                        'active.location.pathname',
                    );

                    const currentPathPattern = op.get(
                        updates,
                        'active.match.route.path',
                    );

                    const route = op.get(updates, 'active.match.route');
                    const transitions = op.get(route, 'transitions', false);

                    // on any route update that matches
                    const routeChangeFunctionMatch =
                        typeof value == 'function' &&
                        value(currentPath, updates);
                    const isCorrectRouteLifecycle =
                        !transitions || updates.transitionState === 'LOADING';
                    const isMatchingRegExp =
                        _.isRegExp(value) && value.test(currentPath);
                    const isMatchingPath =
                        _.isString(value) &&
                        (currentPath === value || currentPathPattern === value);

                    if (
                        routeChangeFunctionMatch ||
                        (isCorrectRouteLifecycle &&
                            (isMatchingRegExp || isMatchingPath))
                    ) {
                        await dispatchingDataLoad(currentPath, updates);
                    }
                },
            });
        } else if (name === 'event' && typeof value == 'string') {
            State.addEventListener(value, dispatchingDataLoad);
        } else if (name === 'pulse' && typeof value == 'object') {
            Pulse.register(path, dispatchingDataLoad, value);
        } else if (
            name === 'suspense' &&
            typeof value === 'string' &&
            !/proto/.test(value) &&
            typeof State[value] == 'undefined'
        ) {
            State.extend(value, dispatchingSuspendingDataLoad);
        }
    });
});

export const useUpdater = () => {
    const [, updater] = useState(new Date());
    return () => updater(new Date());
};

export const useAttachSyncState = (
    target = State,
    updateEventName = 'change',
) => {
    const update = useUpdater();
    useEffect(() => target.addEventListener(updateEventName, update));
    return target;
};

export const useAttachHandle = (name, updateEventName = 'change') => {
    return useAttachSyncState(Handle.get(`${name}.current`), updateEventName);
};

export const useDispatcher = ({ props = {}, state = State }) => (type, obj) => {
    obj = _.isObject(obj) ? obj : {};

    const evt = new ComponentEvent(type, obj);
    const cb = op.get(props, cc(`on-${type}`));

    if (_.isFunction(cb)) state.addEventListener(type, cb);
    state.dispatchEvent(evt);
    if (_.isFunction(cb)) state.removeEventListener(type, cb);
};

export const useStateEffect = (handlers = {}, deps) => {
    const unsubs = [];

    // sanitize handlers
    Object.entries(handlers).forEach(([type, cb]) => {
        if (
            typeof cb === 'function' &&
            !Object.values(op.get(State, ['listeners', type], {})).find(
                f => f === cb,
            )
        ) {
            unsubs.push(State.addEventListener(type, cb));
        }
    });

    useEffect(() => {
        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, deps);
};
