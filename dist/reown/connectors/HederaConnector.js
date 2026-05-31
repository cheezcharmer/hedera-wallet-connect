import { ConstantsUtil } from '@reown/appkit-common';
import { PresetsUtil } from '@reown/appkit-utils';
import { createNamespaces, HederaChainDefinition } from '../utils';
export class HederaConnector {
    constructor({ provider, caipNetworks, namespace }) {
        this.id = ConstantsUtil.CONNECTOR_ID.WALLET_CONNECT;
        this.name = PresetsUtil.ConnectorNamesMap[ConstantsUtil.CONNECTOR_ID.WALLET_CONNECT];
        this.type = 'WALLET_CONNECT';
        this.imageId = PresetsUtil.ConnectorImageIds[ConstantsUtil.CONNECTOR_ID.WALLET_CONNECT];
        this.caipNetworks = caipNetworks;
        this.provider = provider;
        this.chain = namespace;
    }
    get chains() {
        return this.caipNetworks;
    }
    async connectWalletConnect() {
        const namespaces = createNamespaces(this.caipNetworks);
        // Include corresponding EVM chains so EVM-based wallets (e.g. Safe multisig)
        // can match their network in the session proposal
        if (this.chain === 'hedera') {
            const nativeToEvm = {
                mainnet: HederaChainDefinition.EVM.Mainnet,
                testnet: HederaChainDefinition.EVM.Testnet,
            };
            const evmChains = this.caipNetworks
                .map((n) => nativeToEvm[n.id])
                .filter(Boolean);
            if (evmChains.length > 0) {
                const evmNamespaces = createNamespaces(evmChains);
                Object.assign(namespaces, evmNamespaces);
            }
        }
        const connectParams = { optionalNamespaces: namespaces };
        await this.provider.connect(connectParams);
        return {
            clientId: await this.provider.client.core.crypto.getClientId(),
            session: this.provider.session,
        };
    }
    async disconnect() {
        await this.provider.disconnect();
    }
    async authenticate() {
        return false;
    }
}
