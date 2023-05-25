import { Handle, ReactiumSyncState } from '@atomic-reactor/reactium-sdk-core';
import { useEffect, useState } from 'react';

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
