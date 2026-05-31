import { JsonRpcProvider, BaseWallet as BaseEvmWallet, TransactionResponse, JsonRpcTransactionRequest } from 'ethers';
import { JsonRpcError, JsonRpcResult } from '@walletconnect/jsonrpc-utils';
import { Eip155JsonRpcMethod, WalletRequestEventArgs } from '..';
/**
 * Types
 */
interface IInitArgs {
    privateKey?: string;
}
export interface EIP155WalletInterface {
    getPrivateKey(): string;
    getEvmAddress(): string;
    connect(provider: JsonRpcProvider): BaseEvmWallet;
    approveSessionRequest(requestEvent: WalletRequestEventArgs): Promise<JsonRpcResult<any> | JsonRpcError>;
    rejectSessionRequest(requestEvent: WalletRequestEventArgs): JsonRpcError;
    [Eip155JsonRpcMethod.PersonalSign](message: string): Promise<string>;
    [Eip155JsonRpcMethod.Sign](message: string): Promise<string>;
    [Eip155JsonRpcMethod.SignTypedData](domain: any, types: any, data: any): Promise<string>;
    [Eip155JsonRpcMethod.SignTypedDataV3](domain: any, types: any, data: any): Promise<string>;
    [Eip155JsonRpcMethod.SignTypedDataV4](domain: any, types: any, data: any): Promise<string>;
    [Eip155JsonRpcMethod.SignTransaction](transaction: JsonRpcTransactionRequest, provider: JsonRpcProvider): Promise<string>;
    [Eip155JsonRpcMethod.SendTransaction](transaction: JsonRpcTransactionRequest, provider: JsonRpcProvider): Promise<TransactionResponse>;
    [Eip155JsonRpcMethod.SendRawTransaction](rawTransaction: string, provider: JsonRpcProvider): Promise<TransactionResponse>;
}
/**
 * @deprecated EIP155Wallet is deprecated and will be removed in the next major version.
 * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM wallet connectivity instead.
 */
export declare class EIP155Wallet implements EIP155WalletInterface {
    wallet: BaseEvmWallet;
    constructor(wallet: BaseEvmWallet);
    connect(provider: JsonRpcProvider): BaseEvmWallet;
    personal_sign(message: string): Promise<string>;
    eth_sign(message: string): Promise<string>;
    eth_signTypedData(domain: any, types: any, data: any): Promise<string>;
    eth_signTypedData_v3(domain: any, types: any, data: any): Promise<string>;
    eth_signTypedData_v4(domain: any, types: any, data: any): Promise<string>;
    eth_signTransaction(transaction: JsonRpcTransactionRequest, provider: JsonRpcProvider): Promise<string>;
    eth_sendTransaction(transaction: JsonRpcTransactionRequest, provider: JsonRpcProvider): Promise<TransactionResponse>;
    eth_sendRawTransaction(rawTransaction: string, provider: JsonRpcProvider): Promise<TransactionResponse>;
    static init({ privateKey }: IInitArgs): EIP155Wallet;
    getPrivateKey(): string;
    getEvmAddress(): string;
    approveSessionRequest(requestEvent: WalletRequestEventArgs): Promise<JsonRpcError | JsonRpcResult<string>>;
    rejectSessionRequest(requestEvent: WalletRequestEventArgs): JsonRpcError;
}
export {};
