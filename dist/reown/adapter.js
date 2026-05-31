import { CoreHelperUtil } from '@reown/appkit';
import { isReownName } from '@reown/appkit-common';
import { AdapterBlueprint, WcHelpersUtil } from '@reown/appkit-controllers';
import { LedgerId } from '@hiero-ledger/sdk';
import { BrowserProvider, Contract, formatUnits, hexlify, isHexString, JsonRpcSigner, parseUnits, toUtf8Bytes, } from 'ethers';
import { HederaConnector } from './connectors';
import { hederaNamespace, getAccountBalance, HederaChainDefinition } from './utils';
import { createLogger } from '../lib/shared/logger';
export class HederaAdapter extends AdapterBlueprint {
    constructor(params) {
        var _a, _b;
        if (params.namespace !== hederaNamespace && params.namespace !== 'eip155') {
            throw new Error('Namespace must be "hedera" or "eip155"');
        }
        if (params.namespace == 'eip155') {
            console.warn('HederaAdapter with namespace "eip155" is deprecated and will be removed in the next major version. ' +
                'Use WagmiAdapter from @reown/appkit-adapter-wagmi for EVM wallet connectivity instead.');
            if ((_a = params.networks) === null || _a === void 0 ? void 0 : _a.some((n) => n.chainNamespace != 'eip155')) {
                throw new Error('Invalid networks for eip155 namespace');
            }
        }
        else {
            if ((_b = params.networks) === null || _b === void 0 ? void 0 : _b.some((n) => n.chainNamespace != hederaNamespace)) {
                throw new Error('Invalid networks for hedera namespace');
            }
        }
        super(Object.assign({}, params));
        this.logger = createLogger('HederaAdapter');
        this.injectedProviders = new Map();
        this.activeInjectedProvider = null;
        this.injectedListenersSet = false;
        this.getCaipNetworks = (namespace) => {
            var _a;
            const targetNamespace = namespace || this.namespace;
            // If the caller explicitly provided networks, respect them instead of
            // returning all Hedera networks regardless of configuration.
            if ((_a = params.networks) === null || _a === void 0 ? void 0 : _a.length) {
                return params.networks.filter((n) => !targetNamespace || n.chainNamespace === targetNamespace);
            }
            if (targetNamespace === 'eip155') {
                return [HederaChainDefinition.EVM.Mainnet, HederaChainDefinition.EVM.Testnet];
            }
            else if (targetNamespace === hederaNamespace) {
                return [HederaChainDefinition.Native.Mainnet, HederaChainDefinition.Native.Testnet];
            }
            else {
                return [
                    HederaChainDefinition.EVM.Mainnet,
                    HederaChainDefinition.EVM.Testnet,
                    HederaChainDefinition.Native.Mainnet,
                    HederaChainDefinition.Native.Testnet,
                ];
            }
        };
    }
    async setUniversalProvider(universalProvider) {
        this.addConnector(new HederaConnector({
            provider: universalProvider,
            caipNetworks: this.getCaipNetworks() || [],
            namespace: this.namespace,
        }));
    }
    async connect(params) {
        this.logger.debug('connect called with params:', params);
        const type = params.type;
        if (type === 'ANNOUNCED' || type === 'INJECTED') {
            return this.connectInjected(params);
        }
        return this.connectViaWalletConnect(params);
    }
    async connectViaWalletConnect(params) {
        const connector = this.getWalletConnectConnector();
        if (connector && 'connectWalletConnect' in connector) {
            this.logger.debug('Calling HederaConnector.connectWalletConnect');
            await connector.connectWalletConnect();
        }
        else {
            this.logger.warn('HederaConnector not found or connectWalletConnect method missing');
        }
        this.activeInjectedProvider = null;
        return {
            id: 'WALLET_CONNECT',
            type: 'WALLET_CONNECT',
            chainId: Number(params.chainId),
            provider: this.provider,
            address: '',
        };
    }
    async connectInjected(params) {
        var _a, _b, _c, _d, _e;
        const id = params.id;
        const type = params.type;
        const injectedProvider = this.injectedProviders.get(id) ||
            params.provider;
        if (!injectedProvider) {
            throw new Error(`Injected provider not found for id: ${id}`);
        }
        // Hedera-native wallets (e.g. Kabila) announce via EIP-6963 for discovery but
        // cannot fulfill EIP-1193 RPC calls — they require WalletConnect + HIP-820.
        if (injectedProvider.isWalletConnectOnly) {
            this.logger.debug(`connectInjected: "${id}" is WalletConnect-only, falling back to WC`);
            return this.connectViaWalletConnect(params);
        }
        this.logger.debug(`connectInjected: requesting accounts from "${id}"`);
        let accounts;
        try {
            accounts = (await injectedProvider.request({
                method: 'eth_requestAccounts',
            }));
        }
        catch (error) {
            if ((_a = error === null || error === void 0 ? void 0 : error.message) === null || _a === void 0 ? void 0 : _a.includes('already pending')) {
                // User has a pending MetaMask request — surface this so they can action it.
                this.logger.warn('A wallet_requestPermissions request is already pending. ' +
                    'Open the wallet extension and approve or reject the pending request.');
                throw error;
            }
            // Any other rejection (e.g. wallet announced via EIP-6963 but doesn't support
            // EIP-1193) — fall back to WalletConnect pairing instead of surfacing an error.
            this.logger.warn(`connectInjected: "${id}" rejected eth_requestAccounts (${error === null || error === void 0 ? void 0 : error.message}), falling back to WC`);
            return this.connectViaWalletConnect(params);
        }
        if (!accounts || accounts.length === 0) {
            throw new Error('No accounts returned from injected provider');
        }
        let chainIdHex = (await injectedProvider.request({
            method: 'eth_chainId',
        }));
        let chainId = parseInt(chainIdHex, 16);
        const configuredNetworks = this.getCaipNetworks();
        const isChainSupported = configuredNetworks.some((n) => Number(n.id) === chainId);
        if (!isChainSupported && configuredNetworks.length > 0) {
            const targetNetwork = configuredNetworks[0];
            const targetChainIdHex = `0x${Number(targetNetwork.id).toString(16)}`;
            this.logger.debug(`connectInjected: wallet is on chain ${chainId}, switching to ${targetNetwork.name} (${targetNetwork.id})`);
            try {
                await injectedProvider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: targetChainIdHex }],
                });
            }
            catch (switchError) {
                // 4902: chain not added to wallet yet
                if ((switchError === null || switchError === void 0 ? void 0 : switchError.code) === 4902 || ((_c = (_b = switchError === null || switchError === void 0 ? void 0 : switchError.data) === null || _b === void 0 ? void 0 : _b.originalError) === null || _c === void 0 ? void 0 : _c.code) === 4902) {
                    await injectedProvider.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: targetChainIdHex,
                                chainName: targetNetwork.name,
                                nativeCurrency: targetNetwork.nativeCurrency,
                                rpcUrls: [targetNetwork.rpcUrls.default.http[0]],
                                blockExplorerUrls: ((_e = (_d = targetNetwork.blockExplorers) === null || _d === void 0 ? void 0 : _d.default) === null || _e === void 0 ? void 0 : _e.url)
                                    ? [targetNetwork.blockExplorers.default.url]
                                    : undefined,
                            },
                        ],
                    });
                }
                else {
                    throw switchError;
                }
            }
            chainIdHex = (await injectedProvider.request({
                method: 'eth_chainId',
            }));
            chainId = parseInt(chainIdHex, 16);
        }
        this.activeInjectedProvider = injectedProvider;
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(HederaAdapter.INJECTED_DISCONNECT_KEY);
        }
        this.logger.debug(`connectInjected: connected to ${accounts[0]} on chain ${chainId}`);
        const connector = this.connectors.find((c) => c.id === id);
        this.emit('accountChanged', {
            address: accounts[0],
            chainId,
            connector: connector,
        });
        this.setupInjectedListeners(injectedProvider, id);
        return {
            id,
            type: type,
            provider: injectedProvider,
            address: accounts[0],
            chainId,
        };
    }
    setupInjectedListeners(provider, connectorId) {
        var _a, _b;
        if (this.injectedListenersSet) {
            return;
        }
        this.injectedListenersSet = true;
        const connector = this.connectors.find((c) => c.id === connectorId);
        const onAccountsChanged = (accounts) => {
            const addrs = accounts;
            if (addrs.length === 0) {
                this.activeInjectedProvider = null;
                this.emit('disconnect');
            }
            else {
                this.emit('accountChanged', {
                    address: addrs[0],
                    connector: connector,
                });
            }
        };
        const onChainChanged = (chainId) => {
            var _a;
            const newChainId = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
            this.emit('switchNetwork', {
                address: ((_a = this.connectors.find((c) => c.id === connectorId)) === null || _a === void 0 ? void 0 : _a.address) || '',
                chainId: newChainId,
            });
        };
        (_a = provider.on) === null || _a === void 0 ? void 0 : _a.call(provider, 'accountsChanged', onAccountsChanged);
        (_b = provider.on) === null || _b === void 0 ? void 0 : _b.call(provider, 'chainChanged', onChainChanged);
    }
    async disconnect(_params) {
        if (this.activeInjectedProvider) {
            this.activeInjectedProvider = null;
            this.injectedListenersSet = false;
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(HederaAdapter.INJECTED_DISCONNECT_KEY, 'true');
            }
            return { connections: [] };
        }
        try {
            const connector = this.getWalletConnectConnector();
            await connector.disconnect();
        }
        catch (error) {
            this.logger.warn('disconnect - error', error);
        }
        return { connections: [] };
    }
    async getAccounts({ namespace, }) {
        var _a, _b, _c, _d;
        if (this.activeInjectedProvider) {
            const accounts = (await this.activeInjectedProvider.request({
                method: 'eth_accounts',
            }));
            return {
                accounts: accounts.map((address) => CoreHelperUtil.createAccount('eip155', address, 'eoa')),
            };
        }
        const provider = this.provider;
        const addresses = (((_d = (_c = (_b = (_a = provider === null || provider === void 0 ? void 0 : provider.session) === null || _a === void 0 ? void 0 : _a.namespaces) === null || _b === void 0 ? void 0 : _b[namespace]) === null || _c === void 0 ? void 0 : _c.accounts) === null || _d === void 0 ? void 0 : _d.map((account) => {
            const [, , address] = account.split(':');
            return address;
        }).filter((address, index, self) => self.indexOf(address) === index)) || []);
        return {
            accounts: addresses.map((address) => CoreHelperUtil.createAccount(namespace, address, 'eoa')),
        };
    }
    async syncConnectors() {
        if (this.namespace !== 'eip155' || typeof window === 'undefined') {
            return;
        }
        const handleAnnouncement = (event) => {
            const e = event;
            const { info, provider } = e.detail;
            if (!(info === null || info === void 0 ? void 0 : info.rdns) || this.injectedProviders.has(info.rdns)) {
                return;
            }
            this.injectedProviders.set(info.rdns, provider);
            this.addConnector({
                id: info.rdns,
                type: 'ANNOUNCED',
                name: info.name,
                info: { uuid: info.uuid, name: info.name, icon: info.icon, rdns: info.rdns },
                provider,
                chain: 'eip155',
                chains: this.getCaipNetworks(),
            });
            this.logger.debug(`EIP-6963: Discovered wallet "${info.name}" (${info.rdns})`);
        };
        window.addEventListener('eip6963:announceProvider', handleAnnouncement);
        window.dispatchEvent(new Event('eip6963:requestProvider'));
    }
    async syncConnections(_params) {
        return Promise.resolve();
    }
    async getBalance(params) {
        const { address, caipNetwork } = params;
        if (!caipNetwork) {
            return Promise.resolve({
                balance: '0',
                decimals: 0,
                symbol: '',
            });
        }
        const accountBalance = await getAccountBalance(caipNetwork.testnet ? LedgerId.TESTNET : LedgerId.MAINNET, address);
        return Promise.resolve({
            balance: accountBalance
                ? formatUnits(accountBalance.hbars.toTinybars().toString(), 8).toString()
                : '0',
            decimals: caipNetwork.nativeCurrency.decimals,
            symbol: caipNetwork.nativeCurrency.symbol,
        });
    }
    async signMessage(params) {
        const { provider, message, address } = params;
        if (this.activeInjectedProvider) {
            const hexMessage = isHexString(message) ? message : hexlify(toUtf8Bytes(message));
            const signature = (await this.activeInjectedProvider.request({
                method: 'personal_sign',
                params: [hexMessage, address],
            }));
            return { signature };
        }
        if (!provider) {
            throw new Error('Provider is undefined');
        }
        const hederaProvider = provider;
        let signature = '';
        if (this.namespace === hederaNamespace) {
            const response = await hederaProvider.hedera_signMessage({
                signerAccountId: address,
                message,
            });
            signature = response.signatureMap;
        }
        else {
            signature = await hederaProvider.eth_signMessage(message, address);
        }
        return { signature };
    }
    /**
     * @deprecated This method is only used with the eip155 namespace, which is deprecated.
     * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM operations instead.
     */
    async estimateGas(params) {
        const { caipNetwork, address } = params;
        if (this.namespace !== 'eip155') {
            throw new Error('Namespace is not eip155');
        }
        if (this.activeInjectedProvider) {
            const browserProvider = new BrowserProvider(this.activeInjectedProvider, Number(caipNetwork === null || caipNetwork === void 0 ? void 0 : caipNetwork.id));
            const signer = new JsonRpcSigner(browserProvider, address);
            const gas = await signer.estimateGas({
                from: address,
                to: params.to,
                data: params.data,
                type: 0,
            });
            return { gas };
        }
        const { provider } = params;
        if (!provider) {
            throw new Error('Provider is undefined');
        }
        const hederaProvider = provider;
        const result = await hederaProvider.eth_estimateGas({
            data: params.data,
            to: params.to,
            address: address,
        }, address, Number(caipNetwork === null || caipNetwork === void 0 ? void 0 : caipNetwork.id));
        return { gas: result };
    }
    /**
     * @deprecated This method is only used with the eip155 namespace, which is deprecated.
     * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM operations instead.
     */
    async sendTransaction(params) {
        var _a, _b;
        if (this.namespace !== 'eip155') {
            throw new Error('Namespace is not eip155');
        }
        if (this.activeInjectedProvider) {
            const browserProvider = new BrowserProvider(this.activeInjectedProvider, Number((_a = params.caipNetwork) === null || _a === void 0 ? void 0 : _a.id));
            const signer = new JsonRpcSigner(browserProvider, params.address);
            const txResponse = await signer.sendTransaction({
                to: params.to,
                value: params.value,
                data: params.data,
                gasLimit: params.gas,
                gasPrice: params.gasPrice,
                type: 0,
            });
            const txReceipt = await txResponse.wait();
            return { hash: (txReceipt === null || txReceipt === void 0 ? void 0 : txReceipt.hash) || null };
        }
        if (!params.provider) {
            throw new Error('Provider is undefined');
        }
        const hederaProvider = params.provider;
        const tx = await hederaProvider.eth_sendTransaction({
            value: params.value,
            to: params.to,
            data: params.data,
            gas: params.gas,
            gasPrice: params.gasPrice,
            address: params.address,
        }, params.address, Number((_b = params.caipNetwork) === null || _b === void 0 ? void 0 : _b.id));
        return { hash: tx };
    }
    /**
     * @deprecated This method is only used with the eip155 namespace, which is deprecated.
     * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM operations instead.
     */
    async writeContract(params) {
        if (this.namespace !== 'eip155') {
            throw new Error('Namespace is not eip155');
        }
        const { caipNetwork, caipAddress, abi, tokenAddress, method, args } = params;
        let browserProvider;
        if (this.activeInjectedProvider) {
            browserProvider = new BrowserProvider(this.activeInjectedProvider, Number(caipNetwork === null || caipNetwork === void 0 ? void 0 : caipNetwork.id));
        }
        else {
            if (!params.provider) {
                throw new Error('Provider is undefined');
            }
            browserProvider = new BrowserProvider(params.provider, Number(caipNetwork === null || caipNetwork === void 0 ? void 0 : caipNetwork.id));
        }
        const signer = new JsonRpcSigner(browserProvider, caipAddress);
        const contract = new Contract(tokenAddress, abi, signer);
        if (!contract || !method) {
            throw new Error('Contract method is undefined');
        }
        const contractMethod = contract[method];
        if (contractMethod) {
            const result = await contractMethod(...args);
            return { hash: result };
        }
        else
            throw new Error('Contract method is undefined');
    }
    /**
     * @deprecated This method is only used with the eip155 namespace, which is deprecated.
     * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM operations instead.
     */
    async getEnsAddress(params) {
        if (this.namespace !== 'eip155') {
            throw new Error('Namespace is not eip155');
        }
        const { name, caipNetwork } = params;
        if (caipNetwork) {
            if (isReownName(name)) {
                return {
                    address: (await WcHelpersUtil.resolveReownName(name)) || false,
                };
            }
        }
        return { address: false };
    }
    parseUnits(params) {
        return parseUnits(params.value, params.decimals);
    }
    formatUnits(params) {
        return formatUnits(params.value, params.decimals);
    }
    /**
     * @deprecated This method is only used with the eip155 namespace, which is deprecated.
     * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM operations instead.
     */
    async getCapabilities(params) {
        var _a, _b;
        if (this.namespace !== 'eip155') {
            throw new Error('Namespace is not eip155');
        }
        const provider = this.provider;
        if (!provider) {
            throw new Error('Provider is undefined');
        }
        const walletCapabilitiesString = (_b = (_a = provider.session) === null || _a === void 0 ? void 0 : _a.sessionProperties) === null || _b === void 0 ? void 0 : _b['capabilities'];
        if (walletCapabilitiesString) {
            try {
                const walletCapabilities = JSON.parse(walletCapabilitiesString);
                const accountCapabilities = walletCapabilities[params];
                if (accountCapabilities) {
                    return accountCapabilities;
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            }
            catch (error) {
                throw new Error('Error parsing wallet capabilities');
            }
        }
        return await provider.request({
            method: 'wallet_getCapabilities',
            params: [params],
        });
    }
    async getProfile() {
        return Promise.resolve({ profileImage: '', profileName: '' });
    }
    async grantPermissions() {
        return Promise.resolve({});
    }
    async revokePermissions() {
        return Promise.resolve('0x');
    }
    async syncConnection(params) {
        const wasDisconnected = typeof window !== 'undefined' &&
            window.localStorage.getItem(HederaAdapter.INJECTED_DISCONNECT_KEY) === 'true';
        const injectedProvider = !wasDisconnected && (this.activeInjectedProvider || this.injectedProviders.get(params.id));
        if (injectedProvider) {
            // eth_accounts (not eth_requestAccounts) to avoid triggering a popup
            const accounts = (await injectedProvider.request({
                method: 'eth_accounts',
            }));
            if (accounts && accounts.length > 0) {
                const chainIdHex = (await injectedProvider.request({
                    method: 'eth_chainId',
                }));
                const chainId = parseInt(chainIdHex, 16);
                this.activeInjectedProvider = injectedProvider;
                this.setupInjectedListeners(injectedProvider, params.id);
                return {
                    id: params.id,
                    type: 'ANNOUNCED',
                    provider: injectedProvider,
                    address: accounts[0],
                    chainId,
                };
            }
        }
        return {
            id: 'WALLET_CONNECT',
            type: 'WALLET_CONNECT',
            chainId: params.chainId,
            provider: this.provider,
            address: '',
        };
    }
    async switchNetwork(params) {
        const { caipNetwork } = params;
        if (this.activeInjectedProvider) {
            const chainIdHex = `0x${Number(caipNetwork.id).toString(16)}`;
            await this.activeInjectedProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }],
            });
            return;
        }
        const connector = this.getWalletConnectConnector();
        connector.provider.setDefaultChain(caipNetwork.caipNetworkId);
    }
    getWalletConnectConnector() {
        const connector = this.connectors.find((c) => c.type == 'WALLET_CONNECT');
        if (!connector) {
            throw new Error('WalletConnectConnector not found');
        }
        return connector;
    }
    getWalletConnectProvider() {
        const connector = this.connectors.find((c) => c.type === 'WALLET_CONNECT');
        const provider = connector === null || connector === void 0 ? void 0 : connector.provider;
        return provider;
    }
    async walletGetAssets(_params) {
        return Promise.resolve({});
    }
}
HederaAdapter.INJECTED_DISCONNECT_KEY = '@hwc/injected-disconnected';
