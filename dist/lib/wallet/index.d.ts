import { WalletKit, WalletKitTypes } from '@reown/walletkit';
import { SessionTypes } from '@walletconnect/types';
import { Wallet as HederaWallet, AccountId, Transaction, Query } from '@hiero-ledger/sdk';
import { HederaChainId, HederaSessionEvent, HederaJsonRpcMethod } from '../shared';
import Provider from './provider';
import type { HederaNativeWallet } from './types';
export type { HederaNativeWallet } from './types';
export { default as WalletProvider } from './provider';
export declare class HederaWeb3Wallet extends WalletKit implements HederaNativeWallet {
    chains: HederaChainId[] | string[];
    methods: string[];
    sessionEvents: HederaSessionEvent[] | string[];
    constructor(opts: WalletKitTypes.Options, chains?: HederaChainId[] | string[], methods?: string[], sessionEvents?: HederaSessionEvent[] | string[]);
    static create(projectId: string, metadata: WalletKitTypes.Metadata, chains?: HederaChainId[], methods?: string[], sessionEvents?: HederaSessionEvent[] | string[]): Promise<HederaWeb3Wallet>;
    getHederaWallet(chainId: HederaChainId, accountId: AccountId | string, privateKey: string, _provider?: Provider): HederaWallet;
    buildAndApproveSession(accounts: string[], { id, params }: WalletKitTypes.SessionProposal): Promise<SessionTypes.Struct>;
    validateParam(name: string, value: any, expectedType: string): void;
    parseSessionRequest(event: WalletKitTypes.SessionRequest, shouldThrow?: boolean): {
        method: HederaJsonRpcMethod;
        chainId: HederaChainId;
        id: number;
        topic: string;
        body?: Transaction | Query<any> | string | Uint8Array | undefined;
        accountId?: AccountId;
    };
    executeSessionRequest(event: WalletKitTypes.SessionRequest, hederaWallet: HederaWallet): Promise<void>;
    rejectSessionRequest(event: WalletKitTypes.SessionRequest, error: {
        code: number;
        message: string;
    }): Promise<void>;
    hedera_getNodeAddresses(id: number, topic: string, _: any, // ignore this param to be consistent call signature with other functions
    signer: HederaWallet): Promise<void>;
    hedera_executeTransaction(id: number, topic: string, body: Transaction, signer: HederaWallet): Promise<void>;
    hedera_signMessage(id: number, topic: string, body: string, signer: HederaWallet): Promise<void>;
    hedera_signAndExecuteQuery(id: number, topic: string, body: Query<any>, signer: HederaWallet): Promise<void>;
    hedera_signAndExecuteTransaction(id: number, topic: string, body: Transaction, signer: HederaWallet): Promise<void>;
    hedera_signTransaction(id: number, topic: string, body: Uint8Array, signer: HederaWallet): Promise<void>;
}
export default HederaWeb3Wallet;
