import { JsonRpcProvider } from '@walletconnect/jsonrpc-provider';
import { HttpConnection } from '@walletconnect/jsonrpc-http-connection';
import { formatJsonRpcRequest } from '@walletconnect/jsonrpc-utils';
import { BUNDLER_URL, getChainId, HederaChainDefinition } from '../utils';
import { createLogger } from '../../lib/shared/logger';
/**
 * @deprecated EIP155Provider is deprecated and will be removed in the next major version.
 * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM wallet connectivity instead.
 * Hedera's JSON-RPC relay makes it a standard EVM chain, so no custom EVM adapter is needed.
 */
class EIP155Provider {
    constructor({ client, events, namespace, }) {
        this.name = 'eip155';
        this.logger = createLogger('EIP155Provider');
        this.logger.warn('EIP155Provider is deprecated and will be removed in the next major version. ' +
            'Use WagmiAdapter from @reown/appkit-adapter-wagmi for EVM wallet connectivity instead.');
        this.namespace = namespace;
        this.events = events;
        this.client = client;
        this.httpProviders = this.createHttpProviders();
        this.chainId = parseInt(this.getDefaultChain());
    }
    async request(args) {
        switch (args.request.method) {
            case 'eth_requestAccounts':
                return this.getAccounts();
            case 'eth_accounts':
                return this.getAccounts();
            case 'wallet_switchEthereumChain': {
                return (await this.switchChain(args));
            }
            case 'eth_chainId':
                return parseInt(this.getDefaultChain());
            case 'wallet_getCallsStatus':
                return (await this.getCallStatus(args));
            default:
                break;
        }
        if (this.namespace.methods.includes(args.request.method)) {
            return await this.client.request(args);
        }
        return this.getHttpProvider().request(args.request);
    }
    updateNamespace(namespace) {
        this.namespace = Object.assign(this.namespace, namespace);
    }
    setDefaultChain(chainId, rpcUrl) {
        // http provider exists so just set the chainId
        if (!this.httpProviders[chainId]) {
            this.setHttpProvider(parseInt(chainId), rpcUrl);
        }
        this.chainId = parseInt(chainId);
        this.events.emit('default_chain_changed', `${this.name}:${chainId}`);
    }
    requestAccounts() {
        return this.getAccounts();
    }
    getDefaultChain() {
        if (this.chainId)
            return this.chainId.toString();
        if (this.namespace.defaultChain)
            return this.namespace.defaultChain;
        const chainId = this.namespace.chains[0] || 'eip155:295'; // default to mainnet
        return chainId.split(':')[1];
    }
    // ---------- Private ----------------------------------------------- //
    createHttpProvider(chainId, rpcUrl) {
        if (!chainId)
            return undefined;
        const { Testnet, Mainnet } = HederaChainDefinition.EVM;
        const caipNetwork = [Mainnet, Testnet].find((network) => network.id == chainId);
        const rpc = (caipNetwork === null || caipNetwork === void 0 ? void 0 : caipNetwork.rpcUrls.default.http[0]) || rpcUrl;
        if (!rpc) {
            this.logger.warn(`No RPC url for chainId: ${chainId}, skipping`);
            return undefined;
        }
        const http = new JsonRpcProvider(new HttpConnection(rpc, false));
        return http;
    }
    setHttpProvider(chainId, rpcUrl) {
        const http = this.createHttpProvider(chainId, rpcUrl);
        if (http) {
            this.httpProviders[chainId] = http;
        }
    }
    createHttpProviders() {
        const http = {};
        this.namespace.chains.forEach((chain) => {
            var _a;
            const parsedChain = parseInt(getChainId(chain));
            const provider = this.createHttpProvider(parsedChain, (_a = this.namespace.rpcMap) === null || _a === void 0 ? void 0 : _a[chain]);
            if (provider) {
                http[parsedChain] = provider;
            }
        });
        return http;
    }
    getAccounts() {
        const accounts = this.namespace.accounts;
        if (!accounts) {
            return [];
        }
        return Array.from(new Set(accounts
            .filter((account) => account.split(':')[1] === this.chainId.toString())
            .map((account) => account.split(':')[2])));
    }
    getHttpProvider() {
        const chain = this.chainId;
        const http = this.httpProviders[chain];
        if (typeof http === 'undefined') {
            throw new Error(`JSON-RPC provider for ${chain} not found`);
        }
        return http;
    }
    async switchChain(args) {
        var _a, _b;
        let hexChainId = args.request.params
            ? (_a = args.request.params[0]) === null || _a === void 0 ? void 0 : _a.chainId
            : '0x0';
        hexChainId = hexChainId.startsWith('0x') ? hexChainId : `0x${hexChainId}`;
        const parsedChainId = parseInt(hexChainId, 16);
        // if chainId is already approved, switch locally
        if (this.isChainApproved(parsedChainId)) {
            this.setDefaultChain(`${parsedChainId}`);
        }
        else if (this.namespace.methods.includes('wallet_switchEthereumChain')) {
            // try to switch chain within the wallet
            await this.client.request({
                topic: args.topic,
                request: {
                    method: args.request.method,
                    params: [
                        {
                            chainId: hexChainId,
                        },
                    ],
                },
                chainId: (_b = this.namespace.chains) === null || _b === void 0 ? void 0 : _b[0], // Sending a previously unapproved chainId will cause namespace validation failure so we must set request chainId to the first chainId in the namespace to avoid it
            });
            this.setDefaultChain(`${parsedChainId}`);
        }
        else {
            throw new Error(`Failed to switch to chain 'eip155:${parsedChainId}'. The chain is not approved or the wallet does not support 'wallet_switchEthereumChain' method.`);
        }
        return null;
    }
    isChainApproved(chainId) {
        return this.namespace.chains.includes(`${this.name}:${chainId}`);
    }
    async getCallStatus(args) {
        var _a, _b;
        const session = this.client.session.get(args.topic);
        const bundlerName = (_a = session.sessionProperties) === null || _a === void 0 ? void 0 : _a.bundler_name;
        if (bundlerName) {
            const bundlerUrl = this.getBundlerUrl(args.chainId, bundlerName);
            try {
                return await this.getUserOperationReceipt(bundlerUrl, args);
            }
            catch (error) {
                this.logger.warn('Failed to fetch call status from bundler', error, bundlerUrl);
            }
        }
        const customUrl = (_b = session.sessionProperties) === null || _b === void 0 ? void 0 : _b.bundler_url;
        if (customUrl) {
            try {
                return await this.getUserOperationReceipt(customUrl, args);
            }
            catch (error) {
                this.logger.warn('Failed to fetch call status from custom bundler', error, customUrl);
            }
        }
        if (this.namespace.methods.includes(args.request.method)) {
            return await this.client.request(args);
        }
        throw new Error('Fetching call status not approved by the wallet.');
    }
    async getUserOperationReceipt(bundlerUrl, args) {
        var _a, _b;
        const url = new URL(bundlerUrl);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formatJsonRpcRequest('eth_getUserOperationReceipt', [
                (_b = (_a = args.request) === null || _a === void 0 ? void 0 : _a.params) === null || _b === void 0 ? void 0 : _b[0],
            ])),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch user operation receipt - ${response.status}`);
        }
        return await response.json();
    }
    getBundlerUrl(cap2ChainId, bundlerName) {
        return `${BUNDLER_URL}?projectId=${this.client.core.projectId}&chainId=${cap2ChainId}&bundler=${bundlerName}`;
    }
}
export default EIP155Provider;
