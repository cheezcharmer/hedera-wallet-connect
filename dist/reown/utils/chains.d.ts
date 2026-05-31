import { CaipNetwork, ChainNamespace } from '@reown/appkit-common';
import { NamespaceConfig } from '@walletconnect/universal-provider';
import { ProposalTypes } from '@walletconnect/types';
export declare const hederaNamespace: ChainNamespace;
export declare const HederaChainDefinition: {
    Native: {
        Mainnet: CaipNetwork;
        Testnet: CaipNetwork;
    };
    EVM: {
        Mainnet: CaipNetwork;
        Testnet: CaipNetwork;
    };
};
export declare function createNamespaces(caipNetworks: CaipNetwork[]): NamespaceConfig;
export declare const SUPPORTED_EIP155_CHAIN_IDS: Set<string | number>;
export declare function getChainsFromApprovedSession(accounts: string[]): string[];
export declare function getChainId(chain: string): string;
export declare function mergeRequiredOptionalNamespaces(required?: ProposalTypes.RequiredNamespaces, optional?: ProposalTypes.RequiredNamespaces): ProposalTypes.RequiredNamespaces;
