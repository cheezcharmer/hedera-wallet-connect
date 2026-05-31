export declare const RPC_URL = "https://rpc.walletconnect.org/v1/";
export declare const GENERIC_SUBPROVIDER_NAME = "generic";
export declare const BUNDLER_URL = "https://rpc.walletconnect.org/v1/bundler";
export declare const PROVIDER_EVENTS: {
    DEFAULT_CHAIN_CHANGED: string;
};
/**
 * @deprecated Eip155JsonRpcMethod is deprecated and will be removed in the next major version.
 * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM wallet connectivity instead.
 */
export declare enum Eip155JsonRpcMethod {
    PersonalSign = "personal_sign",
    Sign = "eth_sign",
    SignTransaction = "eth_signTransaction",
    SignTypedData = "eth_signTypedData",
    SignTypedDataV3 = "eth_signTypedData_v3",
    SignTypedDataV4 = "eth_signTypedData_v4",
    SendRawTransaction = "eth_sendRawTransaction",
    SendTransaction = "eth_sendTransaction"
}
