import type { SessionTypes } from '@walletconnect/types';
import { CaipNetwork, ChainNamespace } from '@reown/appkit-common';
import { AdapterBlueprint, type ChainAdapterConnector } from '@reown/appkit-controllers';
type UniversalProvider = Parameters<AdapterBlueprint['setUniversalProvider']>[0];
export declare class HederaConnector implements ChainAdapterConnector {
    readonly id: "walletConnect";
    readonly name: string;
    readonly type = "WALLET_CONNECT";
    readonly imageId: string;
    readonly chain: ChainNamespace;
    provider: UniversalProvider;
    protected caipNetworks: CaipNetwork[];
    constructor({ provider, caipNetworks, namespace }: HederaConnector.Options);
    get chains(): CaipNetwork[];
    connectWalletConnect(): Promise<{
        clientId: string;
        session: SessionTypes.Struct;
    }>;
    disconnect(): Promise<void>;
    authenticate(): Promise<boolean>;
}
export declare namespace HederaConnector {
    type Options = {
        provider: UniversalProvider;
        caipNetworks: CaipNetwork[];
        /**
         * The chain namespace for the connector.
         * @remarks The `'eip155'` option is deprecated and will be removed in the next major version.
         * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM wallet connectivity instead.
         */
        namespace: 'hedera' | 'eip155';
    };
}
export {};
