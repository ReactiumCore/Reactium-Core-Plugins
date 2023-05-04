import React from 'react';
import { useHookComponent } from '@atomic-reactor/reactium-core/sdk';

export default () => {
    const DevTools = useHookComponent('DevTools');
    return <DevTools />;
};
