import React, { useEffect } from 'react';
import { __, Zone, ZoneRegistry, Enums } from '@atomic-reactor/reactium-core/sdk';

const DefaultComponent = () => {
    const comps = ZoneRegistry.getZoneComponents('not-found');

    if (comps.length < 1) {
        ZoneRegistry.addComponent({
            zone: 'not-found',
            id: 'NOT_FOUND_DEFAULT',
            component: () => __('PAGE NOT FOUND'),
            order: Enums.priority.highest,
        });

        return () => {
            ZoneRegistry.removeComponent('NOT_FOUND_DEFAULT');
        };
    }
};

export default () => {
    useEffect(DefaultComponent, []);
    return <Zone zone='not-found' />;
};
