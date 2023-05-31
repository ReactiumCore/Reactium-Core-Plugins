const onLoaded = () => {
    if (
        window.LoadingRef &&
        window.LoadingRef.current &&
        typeof window.LoadingRef.current.setVisible == 'function'
    ) {
        window.LoadingRef.current.setVisible(false);
    }
};

const roots = window.roots = {};

export const Shell = async ({
    LoadingComponent,
    loadCb = onLoaded,
    delay = 250,
} = {}) => {
    const { default: React, useRef } = await import('react');
    const { createRoot } = await import('react-dom/client');

    let Loading;
    if (LoadingComponent) Loading = LoadingComponent;
    else {
        const mod = await import('../components/Loading');
        Loading = mod.Loading;
    }

    const ShellComponent = () => {
        window.LoadingRef = useRef();
        return <Loading ref={window.LoadingRef} />;
    };

    const shellRoot = document.querySelector('[data-reactium-shell]');
    try {
        shellRoot && createRoot(shellRoot).render(<ShellComponent />);
    } catch (error) {
        console.error(error);
    }

    const { App } = await import('./index');
    await App(roots);

    setTimeout(loadCb, delay);
};

if (module.hot && !window.disableHMRReload) {
    module.hot.accept(['./index.jsx'], async () => {
        window.location.reload();
    });
}
