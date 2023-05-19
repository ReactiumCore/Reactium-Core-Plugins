import { Handle } from '@atomic-reactor/reactium-sdk-core';
import { useEffect, useState } from 'react';

export const useUpdater = () => {
    const [, updater] = useState(new Date());
    return () => updater(new Date());
};

export const useAttachSyncState = target => {
    const update = useUpdater();
    useEffect(() => target.addEventListener('change', update));
    return target;
};

export const useAttachHandle = name => {
    return useAttachSyncState(Handle.get(`${name}.current`));
};
