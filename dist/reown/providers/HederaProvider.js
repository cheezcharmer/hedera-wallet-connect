import { BrowserProvider, Contract, JsonRpcSigner, hexlify, isHexString, toQuantity, toUtf8Bytes, } from 'ethers';
import UniversalProvider from '@walletconnect/universal-provider';
import { Transaction } from '@hiero-ledger/sdk';
import { HederaJsonRpcMethod, } from '../..';
import { getChainsFromApprovedSession, getChainId, mergeRequiredOptionalNamespaces, SUPPORTED_EIP155_CHAIN_IDS, } from '../utils';
import HIP820Provider from './HIP820Provider';
import EIP155Provider from './EIP155Provider';
import { createLogger } from '../../lib/shared/logger';
// Reown AppKit UniversalProvider for HIP-820 & EIP-155 version implementation of the @hashgraph/hedera-wallet-connect DAppConnector
export class HederaProvider extends UniversalProvider {
    constructor(opts) {
        super(opts);
        this.hederaLogger = createLogger('HederaProvider');
    }
    static async init(opts) {
        var _a, _b;
        const provider = new HederaProvider(opts);
        //@ts-expect-error
        await provider.initialize();
        provider.namespaces = Object.assign(Object.assign({}, (((_a = provider.providerOpts) === null || _a === void 0 ? void 0 : _a.optionalNamespaces) || {})), (((_b = provider.providerOpts) === null || _b === void 0 ? void 0 : _b.requiredNamespaces) || {}));
        if (provider.session)
            provider.initProviders();
        return provider;
    }
    emit(event, data) {
        this.events.emit(event, data);
    }
    getAccountAddresses() {
        if (!this.session) {
            throw new Error('Not initialized. Please call connect()');
        }
        return Object.values(this.session.namespaces).flatMap((namespace) => { var _a; return (_a = namespace.accounts.map((account) => account.split(':')[2])) !== null && _a !== void 0 ? _a : []; });
    }
    async request(args, chain, expiry) {
        var _a, _b, _c, _d, _e;
        if (!this.session || !this.namespaces) {
            throw new Error('Please call connect() before request()');
        }
        let chainId = chain;
        if (Object.values(HederaJsonRpcMethod).includes(args.method)) {
            if (!this.nativeProvider) {
                throw new Error('nativeProvider not initialized. Please call connect()');
            }
            chainId = chainId !== null && chainId !== void 0 ? chainId : (_a = this.namespaces.hedera) === null || _a === void 0 ? void 0 : _a.chains[0];
            return (_b = this.nativeProvider) === null || _b === void 0 ? void 0 : _b.request({
                request: Object.assign({}, args),
                chainId: chainId,
                topic: this.session.topic,
                expiry,
            });
        }
        else {
            if (!this.eip155Provider) {
                throw new Error('eip155Provider not initialized');
            }
            chainId = chainId !== null && chainId !== void 0 ? chainId : (_d = (_c = this.namespaces) === null || _c === void 0 ? void 0 : _c.eip155) === null || _d === void 0 ? void 0 : _d.chains[0];
            return (_e = this.eip155Provider) === null || _e === void 0 ? void 0 : _e.request({
                request: Object.assign({}, args),
                chainId: chainId,
                topic: this.session.topic,
                expiry,
            });
        }
    }
    /**
     * Retrieves the node addresses associated with the current Hedera network.
     *
     * When there is no active session or an error occurs during the request.
     * @returns Promise\<{@link GetNodeAddressesResult}\>
     */
    async hedera_getNodeAddresses() {
        return await this.request({
            method: HederaJsonRpcMethod.GetNodeAddresses,
            params: undefined,
        });
    }
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
    async hedera_executeTransaction(params) {
        return await this.request({
            method: HederaJsonRpcMethod.ExecuteTransaction,
            params,
        });
    }
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
    async hedera_signMessage(params) {
        return await this.request({
            method: HederaJsonRpcMethod.SignMessage,
            params,
        });
    }
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
    async hedera_signAndExecuteQuery(params) {
        return await this.request({
            method: HederaJsonRpcMethod.SignAndExecuteQuery,
            params,
        });
    }
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
    async hedera_signAndExecuteTransaction(params) {
        return await this.request({
            method: HederaJsonRpcMethod.SignAndExecuteTransaction,
            params,
        });
    }
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
    async hedera_signTransaction(params) {
        var _a, _b, _c;
        if (!this.session) {
            throw new Error('Session not initialized. Please call connect()');
        }
        if (!this.nativeProvider) {
            throw new Error('nativeProvider not initialized. Please call connect()');
        }
        if (!((params === null || params === void 0 ? void 0 : params.transactionBody) instanceof Transaction)) {
            throw new Error('Transaction sent in incorrect format. Ensure transaction body is a Transaction object.');
        }
        const signerAccountId = (_b = (_a = params === null || params === void 0 ? void 0 : params.signerAccountId) === null || _a === void 0 ? void 0 : _a.split(':')) === null || _b === void 0 ? void 0 : _b.pop();
        const isValidSigner = (_c = this.nativeProvider) === null || _c === void 0 ? void 0 : _c.requestAccounts().includes(signerAccountId !== null && signerAccountId !== void 0 ? signerAccountId : '');
        if (!isValidSigner) {
            throw new Error(`Signer not found for account ${signerAccountId}`);
        }
        return (await this.nativeProvider.signTransaction(params.transactionBody, this.session.topic));
    }
    async eth_signMessage(message, address) {
        const hexMessage = isHexString(message) ? message : hexlify(toUtf8Bytes(message));
        const signature = await this.request({
            method: 'personal_sign',
            params: [hexMessage, address],
        });
        return signature;
    }
    async eth_estimateGas(data, address, networkId) {
        if (!address) {
            throw new Error('estimateGas - address is undefined');
        }
        if (data.chainNamespace !== 'eip155') {
            throw new Error('estimateGas - chainNamespace is not eip155');
        }
        const txParams = {
            from: data.address,
            to: data.to,
            data: data.data,
            type: 0,
        };
        const browserProvider = new BrowserProvider(this, networkId);
        const signer = new JsonRpcSigner(browserProvider, address);
        return await signer.estimateGas(txParams);
    }
    async eth_sendTransaction(data, address, networkId) {
        if (!address) {
            throw new Error('sendTransaction - address is undefined');
        }
        if (data.chainNamespace !== 'eip155') {
            throw new Error('sendTransaction - chainNamespace is not eip155');
        }
        const txParams = {
            to: data.to,
            value: data.value,
            gasLimit: data.gas,
            gasPrice: data.gasPrice,
            data: data.data,
            type: 0,
        };
        const browserProvider = new BrowserProvider(this, networkId);
        const signer = new JsonRpcSigner(browserProvider, address);
        const txResponse = await signer.sendTransaction(txParams);
        const txReceipt = await txResponse.wait();
        return (txReceipt === null || txReceipt === void 0 ? void 0 : txReceipt.hash) || null;
    }
    async eth_writeContract(data, address, chainId) {
        if (!address) {
            throw new Error('writeContract - address is undefined');
        }
        const browserProvider = new BrowserProvider(this, chainId);
        const signer = new JsonRpcSigner(browserProvider, address);
        const contract = new Contract(data.tokenAddress, data.abi, signer);
        if (!contract || !data.method) {
            throw new Error('Contract method is undefined');
        }
        const method = contract[data.method];
        if (method) {
            return (await method(...data.args));
        }
        throw new Error('Contract method is undefined');
    }
    // Returns the latest block number
    async eth_blockNumber() {
        return this.request({ method: 'eth_blockNumber', params: [] });
    }
    // Executes a call with the given transaction request and block identifier
    async eth_call(tx, block = 'latest') {
        return this.request({ method: 'eth_call', params: [tx, block] });
    }
    // Returns fee history data for the given parameters
    async eth_feeHistory(blockCount, newestBlock, rewardPercentiles) {
        return this.request({
            method: 'eth_feeHistory',
            params: [toQuantity(blockCount), newestBlock, rewardPercentiles],
        });
    }
    // Returns the current gas price
    async eth_gasPrice() {
        return this.request({ method: 'eth_gasPrice', params: [] });
    }
    // Returns block details by hash, optionally including full transactions
    async eth_getBlockByHash(hash, fullTx = false) {
        return this.request({ method: 'eth_getBlockByHash', params: [hash, fullTx] });
    }
    // Returns block details by block number, optionally including full transactions
    async eth_getBlockByNumber(block, fullTx = false) {
        return this.request({ method: 'eth_getBlockByNumber', params: [block, fullTx] });
    }
    // Returns the number of transactions in a block identified by its hash
    async eth_getBlockTransactionCountByHash(hash) {
        return this.request({
            method: 'eth_getBlockTransactionCountByHash',
            params: [hash],
        });
    }
    // Returns the number of transactions in a block identified by its number
    async eth_getBlockTransactionCountByNumber(block) {
        return this.request({
            method: 'eth_getBlockTransactionCountByNumber',
            params: [block],
        });
    }
    // Returns the contract code at the specified address and block
    async eth_getCode(address, block = 'latest') {
        return this.request({ method: 'eth_getCode', params: [address, block] });
    }
    // Returns filter logs based on the provided filter object
    async eth_getFilterLogs(filterId) {
        return this.request({ method: 'eth_getFilterLogs', params: [filterId] });
    }
    // Returns filter changes for the given filter ID
    async eth_getFilterChanges(filterId) {
        return this.request({ method: 'eth_getFilterChanges', params: [filterId] });
    }
    // Returns logs based on the provided filter object
    async eth_getLogs(filter) {
        return this.request({ method: 'eth_getLogs', params: [filter] });
    }
    // Returns storage data at a specific address and position for a given block
    async eth_getStorageAt(address, position, block = 'latest') {
        return this.request({
            method: 'eth_getStorageAt',
            params: [address, position, block],
        });
    }
    // Returns a transaction from a block by its hash and index
    async eth_getTransactionByBlockHashAndIndex(hash, index) {
        return await this.request({
            method: 'eth_getTransactionByBlockHashAndIndex',
            params: [hash, index],
        });
    }
    // Returns a transaction from a block by its number and index
    async eth_getTransactionByBlockNumberAndIndex(block, index) {
        return this.request({
            method: 'eth_getTransactionByBlockNumberAndIndex',
            params: [block, index],
        });
    }
    // Returns transaction details by its hash
    async eth_getTransactionByHash(hash) {
        return this.request({ method: 'eth_getTransactionByHash', params: [hash] });
    }
    // Returns the transaction count for a given address and block
    async eth_getTransactionCount(address, block = 'latest') {
        return this.request({
            method: 'eth_getTransactionCount',
            params: [address, block],
        });
    }
    // Returns the transaction receipt for a given transaction hash
    async eth_getTransactionReceipt(hash) {
        return this.request({ method: 'eth_getTransactionReceipt', params: [hash] });
    }
    // Returns the current hashrate
    async eth_hashrate() {
        return this.request({ method: 'eth_hashrate', params: [] });
    }
    // Returns the max priority fee per gas
    async eth_maxPriorityFeePerGas() {
        return this.request({ method: 'eth_maxPriorityFeePerGas', params: [] });
    }
    // Returns the mining status
    async eth_mining() {
        return this.request({ method: 'eth_mining', params: [] });
    }
    // Creates a new block filter and returns its ID
    async eth_newBlockFilter() {
        return this.request({ method: 'eth_newBlockFilter', params: [] });
    }
    // Creates a new filter based on the provided filter object and returns its ID
    async eth_newFilter(filter) {
        return this.request({ method: 'eth_newFilter', params: [filter] });
    }
    // Submits work for mining (dummy parameters) and returns the result
    async eth_submitWork(params) {
        return this.request({ method: 'eth_submitWork', params });
    }
    // Returns the syncing status
    async eth_syncing() {
        return this.request({ method: 'eth_syncing', params: [] });
    }
    // Uninstalls the filter with the given ID
    async eth_uninstallFilter(filterId) {
        return this.request({ method: 'eth_uninstallFilter', params: [filterId] });
    }
    // Returns the network listening status
    async net_listening() {
        return this.request({ method: 'net_listening', params: [] });
    }
    // Returns the current network version
    async net_version() {
        return this.request({ method: 'net_version', params: [] });
    }
    // Returns the client version string
    async web3_clientVersion() {
        return this.request({ method: 'web3_clientVersion', params: [] });
    }
    async eth_chainId() {
        return this.request({ method: 'eth_chainId', params: [] });
    }
    async connect(params) {
        this.hederaLogger.debug('connect called with params:', params);
        // Update the internal namespace properties before connecting
        if (params) {
            if (params.requiredNamespaces) {
                this.hederaLogger.debug('Setting requiredNamespaces:', params.requiredNamespaces);
                // @ts-ignore - accessing private property
                this.requiredNamespaces = params.requiredNamespaces;
            }
            if (params.optionalNamespaces) {
                this.hederaLogger.debug('Setting optionalNamespaces:', params.requiredNamespaces);
                // @ts-ignore - accessing private property
                this.optionalNamespaces = params.optionalNamespaces;
            }
            if (params.namespaces) {
                this.hederaLogger.debug('Setting namespaces:', params.namespaces);
                // @ts-ignore - accessing private property
                this.namespaces = params.namespaces;
            }
        }
        this.hederaLogger.debug('Calling super.connect with params');
        // Try to directly pass the namespaces to the parent connect
        let result;
        try {
            result = await super.connect(params);
        }
        catch (error) {
            this.hederaLogger.error('Error in super.connect:', error);
            throw error;
        }
        this.hederaLogger.info('super.connect completed successfully');
        this.hederaLogger.debug('Result from super.connect:', result);
        this.initProviders();
        return result;
    }
    async pair(pairingTopic) {
        console.log(pairingTopic);
        //@ts-expect-error
        console.log(this.requiredNamespaces);
        const session = await super.pair(pairingTopic);
        this.initProviders();
        return session;
    }
    initProviders() {
        if (!this.client) {
            throw new Error('Sign Client not initialized');
        }
        if (!this.session || !this.namespaces) {
            return {};
        }
        const namespaces = Object.keys(this.namespaces);
        const providers = {};
        namespaces.forEach((namespace) => {
            var _a, _b, _c, _d;
            const accounts = ((_b = (_a = this.session) === null || _a === void 0 ? void 0 : _a.namespaces[namespace]) === null || _b === void 0 ? void 0 : _b.accounts) || [];
            const approvedChains = getChainsFromApprovedSession(accounts);
            // Filter out non-Hedera EIP155 chains that wallets like MetaMask v11+ include in the session
            const filteredChains = namespace === 'eip155'
                ? approvedChains.filter((chain) => {
                    const chainId = parseInt(getChainId(chain));
                    const supported = SUPPORTED_EIP155_CHAIN_IDS.has(chainId);
                    if (!supported) {
                        this.hederaLogger.warn(`Skipping unsupported EIP155 chain: ${chain}`);
                    }
                    return supported;
                })
                : approvedChains;
            const mergedNamespaces = mergeRequiredOptionalNamespaces(this.namespaces, this.optionalNamespaces);
            const combinedNamespace = Object.assign(Object.assign(Object.assign({}, mergedNamespaces[namespace]), { accounts, chains: filteredChains }), (((_d = (_c = this.optionalNamespaces) === null || _c === void 0 ? void 0 : _c[namespace]) === null || _d === void 0 ? void 0 : _d.rpcMap) && {
                rpcMap: this.optionalNamespaces[namespace].rpcMap,
            }));
            switch (namespace) {
                case 'hedera': {
                    const provider = new HIP820Provider({
                        namespace: combinedNamespace,
                        events: this.events,
                        client: this.client,
                    });
                    this.nativeProvider = provider;
                    providers[namespace] = provider;
                    break;
                }
                case 'eip155': {
                    const provider = new EIP155Provider({
                        namespace: combinedNamespace,
                        events: this.events,
                        client: this.client,
                    });
                    this.eip155Provider = provider;
                    providers[namespace] = provider;
                    break;
                }
                default:
                    throw new Error(`Unsupported namespace: ${namespace}`);
            }
        });
        return providers;
    }
    // @ts-expect-error - override base rpcProviders logic
    get rpcProviders() {
        if (!this.nativeProvider && !this.eip155Provider) {
            return this.initProviders();
        }
        return {
            hedera: this.nativeProvider,
            eip155: this.eip155Provider,
        };
    }
    set rpcProviders(_) { }
}
