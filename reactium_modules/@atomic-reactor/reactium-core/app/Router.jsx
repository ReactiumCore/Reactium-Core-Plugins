import React from 'react';
import { Router as Dom } from 'react-router-dom';
import { useHookComponent } from '@atomic-reactor/reactium-core/sdk';

export const Router = ({ history, children }) => {
    return <Dom history={history}>{children}</Dom>;
};

export const RouterProvider = ({ children, ...props }) => {
    const Router = useHookComponent('Router');
    return <Router {...props}>{children}</Router>;
};

export default Router;
