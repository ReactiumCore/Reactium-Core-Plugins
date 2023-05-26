import {
    Handle,
    ReactiumSyncState,
    ComponentEvent,
} from '@atomic-reactor/reactium-sdk-core';
import { useEffect, useState } from 'react';
import cc from 'camelcase';
import _ from 'underscore';
import op from 'object-path';

export const State = new ReactiumSyncState(window.state || {});

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
