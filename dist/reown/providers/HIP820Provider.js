import { CAIPChainIdToLedgerId, DAppSigner } from '../..';
import { AccountId } from '@hiero-ledger/sdk';
class HIP820Provider {
    constructor(opts) {
        this.namespace = opts.namespace;
        this.chainId = this.getDefaultChain();
        this.events = opts.events;
        this.client = opts.client;
    }
    get httpProviders() {
        return {};
    }
    updateNamespace(namespace) {
        this.namespace = Object.assign(this.namespace, namespace);
    }
    request(args) {
        return this.getSigner(args.topic).request({
            method: args.request.method,
            params: args.request.params,
        });
    }
    async signTransaction(transaction, topic) {
        return this.getSigner(topic).signTransaction(transaction);
    }
    requestAccounts() {
        const accounts = this.namespace.accounts;
        if (!accounts) {
            return [];
        }
        return Array.from(new Set(accounts
            // get the accounts from the active chain
            .filter((account) => account.split(':')[1] === this.chainId.toString())
            // remove namespace & chainId from the string
            .map((account) => account.split(':')[2])));
    }
    setDefaultChain(chainId) {
        this.chainId = chainId;
        this.namespace.defaultChain = chainId;
    }
    getDefaultChain() {
        if (this.chainId)
            return this.chainId;
        if (this.namespace.defaultChain)
            return this.namespace.defaultChain;
        const chainId = this.namespace.chains[0] || 'hedera:mainnet'; // default to mainnet
        return chainId.split(':')[1];
    }
    // create signer on demand
    getSigner(topic) {
        return this.getSigners(topic)[0];
    }
    getSigners(topic) {
        var _a;
        const accounts = (_a = this.namespace.accounts) === null || _a === void 0 ? void 0 : _a.map((account) => {
            const [chain, network, acc] = account.split(':');
            return {
                ledgerId: CAIPChainIdToLedgerId(`${chain}:${network}`),
                accountId: AccountId.fromString(acc),
            };
        });
        if (!accounts) {
            throw new Error('Accounts not found');
        }
        return accounts.map(({ accountId, ledgerId }) => new DAppSigner(accountId, this.client, topic, ledgerId));
    }
}
export default HIP820Provider;
