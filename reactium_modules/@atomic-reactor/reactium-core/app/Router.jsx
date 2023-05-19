import React from 'react';
import { Router as Dom, Switch } from 'react-router-dom';
import { useHookComponent } from '@atomic-reactor/reactium-core/sdk';

export const Router = ({ history }) => {
    const RoutedContent = useHookComponent('RoutedContent');
    return (
        <Dom history={history}>
            <Switch>
                <RoutedContent />
            </Switch>
        </Dom>
    );
};

export default Router;