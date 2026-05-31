import { TransactionRequest } from 'ethers';
import { CaipNetwork, RequestArguments } from '@reown/appkit';
import type { EstimateGasTransactionArgs, SendTransactionArgs, WriteContractArgs } from '@reown/appkit';
import UniversalProvider, { RpcProviderMap, UniversalProviderOpts } from '@walletconnect/universal-provider';
import { Transaction } from '@hiero-ledger/sdk';
import { ExecuteTransactionParams, SignMessageParams, SignAndExecuteQueryParams, SignAndExecuteTransactionParams, SignTransactionParams } from '../..';
import { EthFilter } from '../utils';
import HIP820Provider from './HIP820Provider';
import EIP155Provider from './EIP155Provider';
export type HederaWalletConnectProviderConfig = {
    chains: CaipNetwork[];
} & UniversalProviderOpts;
export declare class HederaProvider extends UniversalProvider {
    private hederaLogger;
    nativeProvider?: HIP820Provider;
    eip155Provider?: EIP155Provider;
    constructor(opts: UniversalProviderOpts);
    static init(opts: UniversalProviderOpts): Promise<HederaProvider>;
    emit(event: string, data?: unknown): void;
    getAccountAddresses(): string[];
    request<T = unknown>(args: RequestArguments, chain?: string | undefined, expiry?: number | undefined): Promise<T>;
    /**
     * Retrieves the node addresses associated with the current Hedera network.
     *
     * When there is no active session or an error occurs during the request.
     * @returns Promise\<{@link GetNodeAddressesResult}\>
     */
    hedera_getNodeAddresses(): Promise<{
        nodes: string[];
    }>;
    /**
     * Executes a transaction on the Hedera network.
     *
     * @param {ExecuteTransactionParams} params - The parameters of type {@link ExecuteTransactionParams | `ExecuteTransactionParams`} required for the transaction execution.
     * @param {string[]} params.signedTransaction - Array of Base64-encoded `Transaction`'s
     * @returns Promise\<{@link ExecuteTransactionResult}\>
     * @example
     * Use helper `transactionToBase64String` to encode `Transaction` to Base64 string
     * ```ts
     * const params = {
     *  signedTransaction: [transactionToBase64String(transaction)]
     * }
     *
     * const result = await dAppConnector.executeTransaction(params)
     * ```
     */
    hedera_executeTransaction(params: ExecuteTransactionParams): Promise<import("@hiero-ledger/sdk/lib/transaction/TransactionResponse").TransactionResponseJSON>;
    /**
     * Signs a provided `message` with provided `signerAccountId`.
     *
     * @param {SignMessageParams} params - The parameters of type {@link SignMessageParams | `SignMessageParams`} required for signing message.
     * @param {string} params.signerAccountId - a signer Hedera Account identifier in {@link https://hips.hedera.com/hip/hip-30 | HIP-30} (`<nework>:<shard>.<realm>.<num>`) form.
     * @param {string} params.message - a plain UTF-8 string
     * @returns Promise\<{@link SignMessageResult}\>
     * @example
     * ```ts
     * const params = {
     *  signerAccountId: 'hedera:testnet:0.0.12345',
     *  message: 'Hello World!'
     * }
     *
     * const result = await dAppConnector.signMessage(params)
     * ```
     */
    hedera_signMessage(params: SignMessageParams): Promise<{
        signatureMap: string;
    }>;
    /**
     * Signs and send `Query` on the Hedera network.
     *
     * @param {SignAndExecuteQueryParams} params - The parameters of type {@link SignAndExecuteQueryParams | `SignAndExecuteQueryParams`} required for the Query execution.
     * @param {string} params.signerAccountId - a signer Hedera Account identifier in {@link https://hips.hedera.com/hip/hip-30 | HIP-30} (`<nework>:<shard>.<realm>.<num>`) form.
     * @param {string} params.query - `Query` object represented as Base64 string
     * @returns Promise\<{@link SignAndExecuteQueryResult}\>
     * @example
     * Use helper `queryToBase64String` to encode `Query` to Base64 string
     * ```ts
     * const params = {
     *  signerAccountId: '0.0.12345',
     *  query: queryToBase64String(query),
     * }
     *
     * const result = await dAppConnector.signAndExecuteQuery(params)
     * ```
     */
    hedera_signAndExecuteQuery(params: SignAndExecuteQueryParams): Promise<{
        response: string;
    }>;
    /**
     * Signs and executes Transactions on the Hedera network.
     *
     * @param {SignAndExecuteTransactionParams} params - The parameters of type {@link SignAndExecuteTransactionParams | `SignAndExecuteTransactionParams`} required for `Transaction` signing and execution.
     * @param {string} params.signerAccountId - a signer Hedera Account identifier in {@link https://hips.hedera.com/hip/hip-30 | HIP-30} (`<nework>:<shard>.<realm>.<num>`) form.
     * @param {string[]} params.transaction - Array of Base64-encoded `Transaction`'s
     * @returns Promise\<{@link SignAndExecuteTransactionResult}\>
     * @example
     * Use helper `transactionToBase64String` to encode `Transaction` to Base64 string
     * ```ts
     * const params = {
     *  signerAccountId: '0.0.12345'
     *  transaction: [transactionToBase64String(transaction)]
     * }
     *
     * const result = await dAppConnector.signAndExecuteTransaction(params)
     * ```
     */
    hedera_signAndExecuteTransaction(params: SignAndExecuteTransactionParams): Promise<import("@hiero-ledger/sdk/lib/transaction/TransactionResponse").TransactionResponseJSON>;
    /**
     * Signs and executes Transactions on the Hedera network.
     *
     * @param {SignTransactionParams} params - The parameters of type {@link SignTransactionParams | `SignTransactionParams`} required for `Transaction` signing.
     * @param {string} params.signerAccountId - a signer Hedera Account identifier in {@link https://hips.hedera.com/hip/hip-30 | HIP-30} (`<nework>:<shard>.<realm>.<num>`) form.
     * @param {Transaction} params.transactionBody - a Transaction object built with the @hgraph/sdk
     * @returns Promise\<{@link SignTransactionResult}\>
     * @example
     * ```ts
     *
     * const params = {
     *  signerAccountId: '0.0.12345',
     *  transactionBody
     * }
     *
     * const result = await dAppConnector.signTransaction(params)
     * ```
     */
    hedera_signTransaction(params: SignTransactionParams): Promise<Transaction>;
    eth_signMessage(message: string, address: string): Promise<`0x${string}`>;
    eth_estimateGas(data: EstimateGasTransactionArgs, address: string, networkId: number): Promise<bigint>;
    eth_sendTransaction(data: SendTransactionArgs, address: string, networkId: number): Promise<`0x${string}`>;
    eth_writeContract(data: WriteContractArgs, address: string, chainId: number): Promise<string>;
    eth_blockNumber(): Promise<string>;
    eth_call(tx: TransactionRequest, block?: string): Promise<string>;
    eth_feeHistory(blockCount: number, newestBlock: string, rewardPercentiles: number[]): Promise<string>;
    eth_gasPrice(): Promise<string>;
    eth_getBlockByHash(hash: string, fullTx?: boolean): Promise<string>;
    eth_getBlockByNumber(block: string, fullTx?: boolean): Promise<unknown>;
    eth_getBlockTransactionCountByHash(hash: string): Promise<string>;
    eth_getBlockTransactionCountByNumber(block: string): Promise<string>;
    eth_getCode(address: string, block?: string): Promise<string>;
    eth_getFilterLogs(filterId: string): Promise<string>;
    eth_getFilterChanges(filterId: string): Promise<string>;
    eth_getLogs(filter: EthFilter): Promise<string>;
    eth_getStorageAt(address: string, position: string, block?: string): Promise<string>;
    eth_getTransactionByBlockHashAndIndex(hash: string, index: string): Promise<string>;
    eth_getTransactionByBlockNumberAndIndex(block: string, index: string): Promise<string>;
    eth_getTransactionByHash(hash: string): Promise<string>;
    eth_getTransactionCount(address: string, block?: string): Promise<string>;
    eth_getTransactionReceipt(hash: string): Promise<string>;
    eth_hashrate(): Promise<string>;
    eth_maxPriorityFeePerGas(): Promise<string>;
    eth_mining(): Promise<string>;
    eth_newBlockFilter(): Promise<string>;
    eth_newFilter(filter: EthFilter): Promise<string>;
    eth_submitWork(params: string[]): Promise<string>;
    eth_syncing(): Promise<string>;
    eth_uninstallFilter(filterId: string): Promise<string>;
    net_listening(): Promise<string>;
    net_version(): Promise<string>;
    web3_clientVersion(): Promise<string>;
    eth_chainId(): Promise<string>;
    connect(params?: any): Promise<any>;
    pair(pairingTopic: string | undefined): ReturnType<UniversalProvider['pair']>;
    private initProviders;
    get rpcProviders(): RpcProviderMap;
    set rpcProviders(_: RpcProviderMap);
}
