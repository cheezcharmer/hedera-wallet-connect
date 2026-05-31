import { CaipNetwork } from '@reown/appkit';
import { type ChainNamespace } from '@reown/appkit-common';
import { AdapterBlueprint } from '@reown/appkit-controllers';
type UniversalProvider = Parameters<AdapterBlueprint['setUniversalProvider']>[0];
type AdapterSendTransactionParams = AdapterBlueprint.SendTransactionParams & {
    address: string;
};
type GetEnsAddressParams = {
    name: string;
    caipNetwork?: CaipNetwork;
};
type GetEnsAddressResult = {
    address: string | false;
};
type GetProfileResult = {
    profileImage: string;
    profileName: string;
};
export declare class HederaAdapter extends AdapterBlueprint {
    private static INJECTED_DISCONNECT_KEY;
    private logger;
    private injectedProviders;
    private activeInjectedProvider;
    constructor(params: HederaAdapter.Params);
    setUniversalProvider(universalProvider: UniversalProvider): Promise<void>;
    connect(params: AdapterBlueprint.ConnectParams): Promise<AdapterBlueprint.ConnectResult>;
    private connectViaWalletConnect;
    private connectInjected;
    private injectedListenersSet;
    private setupInjectedListeners;
    disconnect(_params?: AdapterBlueprint.DisconnectParams): Promise<AdapterBlueprint.DisconnectResult>;
    getAccounts({ namespace, }: AdapterBlueprint.GetAccountsParams & {
        namespace: ChainNamespace;
    }): Promise<AdapterBlueprint.GetAccountsResult>;
    syncConnectors(): Promise<void>;
    syncConnections(_params: AdapterBlueprint.SyncConnectionsParams): Promise<void>;
    getBalance(params: AdapterBlueprint.GetBalanceParams): Promise<AdapterBlueprint.GetBalanceResult>;
    signMessage(params: AdapterBlueprint.SignMessageParams): Promise<AdapterBlueprint.SignMessageResult>;
    /**
     * @deprecated This method is only used with the eip155 namespace, which is deprecated.
     * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM operations instead.
     */
    estimateGas(params: AdapterBlueprint.EstimateGasTransactionArgs): Promise<AdapterBlueprint.EstimateGasTransactionResult>;
    /**
     * @deprecated This method is only used with the eip155 namespace, which is deprecated.
     * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM operations instead.
     */
    sendTransaction(params: AdapterSendTransactionParams): Promise<AdapterBlueprint.SendTransactionResult>;
    /**
     * @deprecated This method is only used with the eip155 namespace, which is deprecated.
     * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM operations instead.
     */
    writeContract(params: AdapterBlueprint.WriteContractParams): Promise<AdapterBlueprint.WriteContractResult>;
    /**
     * @deprecated This method is only used with the eip155 namespace, which is deprecated.
     * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM operations instead.
     */
    getEnsAddress(params: GetEnsAddressParams): Promise<GetEnsAddressResult>;
    parseUnits(params: AdapterBlueprint.ParseUnitsParams): AdapterBlueprint.ParseUnitsResult;
    formatUnits(params: AdapterBlueprint.FormatUnitsParams): AdapterBlueprint.FormatUnitsResult;
    /**
     * @deprecated This method is only used with the eip155 namespace, which is deprecated.
     * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM operations instead.
     */
    getCapabilities(params: AdapterBlueprint.GetCapabilitiesParams): Promise<unknown>;
    getProfile(): Promise<GetProfileResult>;
    grantPermissions(): Promise<unknown>;
    revokePermissions(): Promise<`0x${string}`>;
    syncConnection(params: AdapterBlueprint.SyncConnectionParams): Promise<{
        id: string;
        type: any;
        provider: any;
        address: string;
        chainId: number;
    } | {
        id: string;
        type: "WALLET_CONNECT";
        chainId: string | number;
        provider: UniversalProvider;
        address: string;
    }>;
    switchNetwork(params: AdapterBlueprint.SwitchNetworkParams): Promise<void>;
    protected getWalletConnectConnector(): ReturnType<AdapterBlueprint['getWalletConnectConnector']>;
    getWalletConnectProvider(): UniversalProvider;
    walletGetAssets(_params: AdapterBlueprint.WalletGetAssetsParams): Promise<AdapterBlueprint.WalletGetAssetsResponse>;
}
export declare namespace HederaAdapter {
    type Params = AdapterBlueprint.Params & {
        namespaceMode?: 'optional' | 'required';
    };
}
export {};
