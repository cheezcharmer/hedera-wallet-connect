import { EventEmitter } from 'events';
import { DAppSigner } from '../..';
import { SessionNamespace, RequestParams, IProvider } from '@walletconnect/universal-provider';
import { SessionTypes } from '@walletconnect/types';
import { Transaction } from '@hiero-ledger/sdk';
declare class HIP820Provider implements IProvider {
    events: EventEmitter;
    client: IProvider['client'];
    namespace: SessionNamespace;
    chainId: string;
    constructor(opts: {
        namespace: SessionNamespace;
        client: IProvider['client'];
        events: EventEmitter;
    });
    get httpProviders(): {};
    updateNamespace(namespace: SessionTypes.Namespace): void;
    request<T = unknown>(args: RequestParams): Promise<T>;
    signTransaction<T extends Transaction>(transaction: T, topic: string): Promise<T>;
    requestAccounts(): string[];
    setDefaultChain(chainId: string): void;
    getDefaultChain(): string;
    getSigner(topic: string): DAppSigner;
    getSigners(topic: string): DAppSigner[];
}
export default HIP820Provider;
