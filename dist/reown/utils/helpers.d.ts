/**
 * Gets message from various signing request methods by filtering out
 * a value that is not an address (thus is a message).
 * If it is a hex string, it gets converted to utf8 string
 *
 * @deprecated This function is deprecated and will be removed in the next major version.
 * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM wallet connectivity instead.
 */
export declare function getSignParamsMessage(params: string[]): string;
/**
 * Gets data from various signTypedData request methods by filtering out
 * a value that is not an address (thus is data).
 * If data is a string convert it to object
 *
 * @deprecated This function is deprecated and will be removed in the next major version.
 * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM wallet connectivity instead.
 */
export declare function getSignTypedDataParamsData(params: string[]): any;
