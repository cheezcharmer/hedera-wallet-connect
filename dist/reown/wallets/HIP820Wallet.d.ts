import { Wallet as HederaWallet, AccountId, Transaction, Query, PrivateKey } from '@hiero-ledger/sdk';
import { JsonRpcError, JsonRpcResult } from '@walletconnect/jsonrpc-utils';
import { HederaChainId, HederaJsonRpcMethod, GetNodeAddressesResult, ExecuteTransactionResult, SignAndExecuteQueryResult, SignMessageResult, SignAndExecuteTransactionResult, SignTransactionResult, WalletRequestEventArgs } from '../..';
import Provider from '../../lib/wallet/provider';
interface IInitArgs {
    chainId: HederaChainId;
    accountId: AccountId | string;
    privateKey: PrivateKey;
    _provider?: Provider;
}
export interface HIP820WalletInterface {
    approveSessionRequest(requestEvent: WalletRequestEventArgs): Promise<JsonRpcResult<any> | JsonRpcError>;
    rejectSessionRequest(requestEvent: WalletRequestEventArgs): JsonRpcError;
    getHederaWallet(): HederaWallet;
    [HederaJsonRpcMethod.GetNodeAddresses](id: number, _: any): Promise<GetNodeAddressesResult>;
    [HederaJsonRpcMethod.ExecuteTransaction](id: number, body: Transaction): Promise<ExecuteTransactionResult | JsonRpcError>;
    [HederaJsonRpcMethod.SignMessage](id: number, body: string): Promise<SignMessageResult>;
    [HederaJsonRpcMethod.SignAndExecuteQuery](id: number, body: Query<any>): Promise<SignAndExecuteQueryResult | JsonRpcError>;
    [HederaJsonRpcMethod.SignAndExecuteTransaction](id: number, body: Transaction): Promise<SignAndExecuteTransactionResult | JsonRpcError>;
    [HederaJsonRpcMethod.SignTransaction](id: number, body: Uint8Array): Promise<SignTransactionResult>;
}
export declare class HIP820Wallet implements HIP820WalletInterface {
    wallet: HederaWallet;
    constructor(wallet: HederaWallet);
    getHederaWallet(): HederaWallet;
    static init({ chainId, accountId, privateKey, _provider }: IInitArgs): HIP820Wallet;
    validateParam(name: string, value: any, expectedType: string): void;
    parseSessionRequest(event: WalletRequestEventArgs, shouldThrow?: boolean): {
        method: HederaJsonRpcMethod;
        chainId: HederaChainId;
        id: number;
        topic: string;
        body?: Transaction | Query<any> | string | Uint8Array | undefined;
        accountId?: AccountId;
    };
    approveSessionRequest(event: WalletRequestEventArgs): Promise<JsonRpcResult<any> | JsonRpcError>;
    rejectSessionRequest(requestEvent: WalletRequestEventArgs): JsonRpcError;
    hedera_getNodeAddresses(id: number, _: any): Promise<JsonRpcResult<{
        nodes: string[];
    }>>;
    hedera_executeTransaction(id: number, signedTransaction: Transaction): Promise<ExecuteTransactionResult | JsonRpcError>;
    hedera_signMessage(id: number, body: string): Promise<JsonRpcResult<{
        signatureMap: string;
    }>>;
    hedera_signAndExecuteQuery(id: number, body: Query<any>): Promise<JsonRpcError | JsonRpcResult<{
        response: string;
    }>>;
    hedera_signAndExecuteTransaction(id: number, transaction: Transaction): Promise<JsonRpcError | JsonRpcResult<import("@hiero-ledger/sdk/lib/transaction/TransactionResponse").TransactionResponseJSON>>;
    hedera_signTransaction(id: number, body: Uint8Array): Promise<JsonRpcResult<{
        signatureMap: string;
    }>>;
}
export default HIP820Wallet;
