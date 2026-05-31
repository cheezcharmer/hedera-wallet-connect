export const RPC_URL = 'https://rpc.walletconnect.org/v1/';
export const GENERIC_SUBPROVIDER_NAME = 'generic';
export const BUNDLER_URL = `${RPC_URL}bundler`;
export const PROVIDER_EVENTS = {
    DEFAULT_CHAIN_CHANGED: 'default_chain_changed',
};
/**
 * @deprecated Eip155JsonRpcMethod is deprecated and will be removed in the next major version.
 * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM wallet connectivity instead.
 */
// EIP-155 Wallet Methods
export var Eip155JsonRpcMethod;
(function (Eip155JsonRpcMethod) {
    Eip155JsonRpcMethod["PersonalSign"] = "personal_sign";
    Eip155JsonRpcMethod["Sign"] = "eth_sign";
    Eip155JsonRpcMethod["SignTransaction"] = "eth_signTransaction";
    Eip155JsonRpcMethod["SignTypedData"] = "eth_signTypedData";
    Eip155JsonRpcMethod["SignTypedDataV3"] = "eth_signTypedData_v3";
    Eip155JsonRpcMethod["SignTypedDataV4"] = "eth_signTypedData_v4";
    Eip155JsonRpcMethod["SendRawTransaction"] = "eth_sendRawTransaction";
    Eip155JsonRpcMethod["SendTransaction"] = "eth_sendTransaction";
})(Eip155JsonRpcMethod || (Eip155JsonRpcMethod = {}));
