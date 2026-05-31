import { EventEmitter } from 'events';
import { SessionTypes } from '@walletconnect/types';
import { IProvider, SessionNamespace, RpcProvidersMap, RequestParams, Namespace } from '@walletconnect/universal-provider';
/**
 * @deprecated EIP155Provider is deprecated and will be removed in the next major version.
 * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM wallet connectivity instead.
 * Hedera's JSON-RPC relay makes it a standard EVM chain, so no custom EVM adapter is needed.
 */
declare class EIP155Provider implements IProvider {
    name: string;
    client: IProvider['client'];
    chainId: number;
    namespace: SessionNamespace;
    httpProviders: RpcProvidersMap;
    events: EventEmitter;
    private logger;
    constructor({ client, events, namespace, }: {
        client: IProvider['client'];
        events: EventEmitter;
        namespace: Namespace;
    });
    request<T = unknown>(args: RequestParams): Promise<T>;
    updateNamespace(namespace: SessionTypes.Namespace): void;
    setDefaultChain(chainId: string, rpcUrl?: string | undefined): void;
    requestAccounts(): string[];
    getDefaultChain(): string;
    private createHttpProvider;
    private setHttpProvider;
    private createHttpProviders;
    private getAccounts;
    private getHttpProvider;
    private switchChain;
    private isChainApproved;
    private getCallStatus;
    private getUserOperationReceipt;
    private getBundlerUrl;
}
export default EIP155Provider;
