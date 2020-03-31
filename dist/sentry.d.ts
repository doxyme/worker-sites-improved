declare type SentryConfig = {
    app: string;
    env: string;
    sentryKey: string;
    sentryProjectId: string;
    release?: string;
};
declare const _default: {
    captureMessage: typeof captureMessage;
    captureException: typeof captureException;
    captureEvent: typeof captureEvent;
};
export default _default;
export declare function captureMessage(config: SentryConfig, formatted: string, extra: any): Promise<void>;
export declare function captureException(config: SentryConfig, err: any, request?: Request): Promise<void>;
export declare function captureEvent(config: SentryConfig, data: any, request?: Request): Promise<void>;
