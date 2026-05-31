import { Client, type AccountId, type Executable, type Provider as HederaWalletProvider, type TransactionId, type TransactionResponse, type TransactionReceipt } from '@hiero-ledger/sdk';
export default class Provider implements HederaWalletProvider {
    private client;
    constructor(client: Client);
    static fromClient(client: Client): Provider;
    getLedgerId(): import("@hiero-ledger/sdk").LedgerId | null;
    getNetwork(): {
        [key: string]: string | AccountId;
    };
    getMirrorNetwork(): string[];
    getAccountBalance(accountId: AccountId | string): Promise<import("@hiero-ledger/sdk").AccountBalance>;
    getAccountInfo(accountId: AccountId | string): Promise<import("@hiero-ledger/sdk").AccountInfo>;
    getAccountRecords(accountId: string | AccountId): Promise<import("@hiero-ledger/sdk").TransactionRecord[]>;
    getTransactionReceipt(transactionId: TransactionId | string): Promise<TransactionReceipt>;
    waitForReceipt(response: TransactionResponse): Promise<TransactionReceipt>;
    call<Request, Response, Output>(request: Executable<Request, Response, Output>): Promise<Output>;
}
