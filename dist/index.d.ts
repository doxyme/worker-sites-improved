declare type Config = {
    debug: boolean;
    manifest: any;
    basepath: string;
    spaFallback: string;
    app: string;
    env: string;
    sentryKey: string;
    sentryProjectId: string;
};
declare function init(config: Config): {
    basepath: string;
    debug: boolean;
    manifest: any;
    spaFallback: string;
    app: string;
    env: string;
    sentryKey: string;
    sentryProjectId: string;
};
declare function getOptionsEventListener(config: Config): (event: FetchEvent) => void;
declare function getRequestEventListener(config: Config): (event: FetchEvent) => void;
declare const _default: {
    init: typeof init;
    getOptionsEventListener: typeof getOptionsEventListener;
    getRequestEventListener: typeof getRequestEventListener;
};
export default _default;
