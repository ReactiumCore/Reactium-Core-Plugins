const onLoaded = () => {
    if (
        window.LoadingRef &&
        window.LoadingRef.current &&
        typeof window.LoadingRef.current.setVisible == 'function'
    ) {
        window.LoadingRef.current.setVisible(false);
    }
};

const shellRoot = document.querySelector('[data-reactium-shell]');

export const Shell = async (
    LoadingComponent,
    loadCb = onLoaded,
    delay = 250,
) => {
    const { default: React, useRef } = await import('react');
    const { createRoot } = await import('react-dom/client');

    let Loading;
    if (LoadingComponent) Loading = LoadingComponent;
    else {
        const mod = await import('../components/Loading');
        Loading = mod.Loading;
    }

    const Shell = () => {
        window.LoadingRef = useRef();
        return <Loading ref={window.LoadingRef} />;
    };

    try {
        createRoot(shellRoot).render(<Shell />);
    } catch (error) {
        console.error(error);
    }

    const { App } = await import('./index');
    await App();

    setTimeout(loadCb, delay);
};

if (module.hot && !window.disableHMRReload) {
    module.hot.accept(['./index.js'], () => {
        window.location.reload();
    });
}
