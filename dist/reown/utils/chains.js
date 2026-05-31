import { defineChain } from '@reown/appkit/networks';
import { WcHelpersUtil } from '@reown/appkit-controllers';
import { mergeArrays, normalizeNamespaces } from '@walletconnect/utils';
import { HederaJsonRpcMethod } from '../..';
export const hederaNamespace = 'hedera';
export const HederaChainDefinition = {
    Native: {
        Mainnet: defineChain({
            id: 'mainnet',
            chainNamespace: hederaNamespace,
            caipNetworkId: 'hedera:mainnet',
            name: 'Hedera Mainnet',
            nativeCurrency: {
                symbol: 'ℏ',
                name: 'HBAR',
                decimals: 8,
            },
            rpcUrls: {
                default: {
                    http: ['https://mainnet.hashio.io/api'],
                },
            },
            blockExplorers: {
                default: {
                    name: 'Hashscan',
                    url: 'https://hashscan.io/mainnet',
                },
            },
            testnet: false,
        }),
        Testnet: defineChain({
            id: 'testnet',
            chainNamespace: hederaNamespace,
            caipNetworkId: 'hedera:testnet',
            name: 'Hedera Testnet',
            nativeCurrency: {
                symbol: 'ℏ',
                name: 'HBAR',
                decimals: 8,
            },
            rpcUrls: {
                default: {
                    http: ['https://testnet.hashio.io/api'],
                },
            },
            blockExplorers: {
                default: {
                    name: 'Hashscan',
                    url: 'https://hashscan.io/testnet',
                },
            },
            testnet: true,
        }),
    },
    EVM: {
        Mainnet: defineChain({
            id: 295,
            name: 'Hedera Mainnet EVM',
            chainNamespace: 'eip155',
            caipNetworkId: 'eip155:295',
            nativeCurrency: {
                symbol: 'ℏ',
                name: 'HBAR',
                decimals: 18,
            },
            rpcUrls: {
                default: {
                    http: ['https://mainnet.hashio.io/api'],
                },
            },
            blockExplorers: {
                default: {
                    name: 'Hashscan',
                    url: 'https://hashscan.io/testnet',
                },
            },
            testnet: false,
        }),
        Testnet: defineChain({
            id: 296,
            name: 'Hedera Testnet EVM',
            chainNamespace: 'eip155',
            caipNetworkId: 'eip155:296',
            nativeCurrency: {
                symbol: 'ℏ',
                name: 'HBAR',
                decimals: 18,
            },
            rpcUrls: {
                default: {
                    http: ['https://testnet.hashio.io/api'],
                },
            },
            blockExplorers: {
                default: {
                    name: 'Hashscan',
                    url: 'https://hashscan.io/testnet',
                },
            },
            testnet: true,
        }),
    },
};
// Support Hedera Networks
export function createNamespaces(caipNetworks) {
    return caipNetworks.reduce((acc, chain) => {
        const { id, chainNamespace, rpcUrls } = chain;
        const rpcUrl = rpcUrls.default.http[0];
        const methods = chainNamespace == 'hedera'
            ? Object.values(HederaJsonRpcMethod)
            : WcHelpersUtil.getMethodsByChainNamespace(chainNamespace);
        if (!acc[chainNamespace]) {
            acc[chainNamespace] = {
                methods,
                events: ['accountsChanged', 'chainChanged'],
                chains: [],
                rpcMap: {},
            };
        }
        const caipNetworkId = `${chainNamespace}:${id}`;
        const namespace = acc[chainNamespace];
        namespace.chains.push(caipNetworkId);
        if ((namespace === null || namespace === void 0 ? void 0 : namespace.rpcMap) && rpcUrl) {
            namespace.rpcMap[id] = rpcUrl;
        }
        return acc;
    }, {});
}
export const SUPPORTED_EIP155_CHAIN_IDS = new Set([
    HederaChainDefinition.EVM.Mainnet.id, // 295
    HederaChainDefinition.EVM.Testnet.id, // 296
]);
export function getChainsFromApprovedSession(accounts) {
    return accounts.map((address) => `${address.split(':')[0]}:${address.split(':')[1]}`);
}
export function getChainId(chain) {
    return chain.includes(':') ? chain.split(':')[1] : chain;
}
export function mergeRequiredOptionalNamespaces(required = {}, optional = {}) {
    const requiredNamespaces = normalizeNamespaces(required);
    const optionalNamespaces = normalizeNamespaces(optional);
    return merge(requiredNamespaces, optionalNamespaces);
}
function merge(requiredNamespaces, optionalNamespaces) {
    var _a, _b, _c;
    const merged = Object.assign({}, requiredNamespaces);
    for (const [namespace, values] of Object.entries(optionalNamespaces)) {
        if (!merged[namespace]) {
            merged[namespace] = values;
        }
        else {
            merged[namespace] = Object.assign(Object.assign(Object.assign({}, merged[namespace]), values), { chains: mergeArrays(values.chains, (_a = merged[namespace]) === null || _a === void 0 ? void 0 : _a.chains), methods: mergeArrays(values.methods || [], ((_b = merged[namespace]) === null || _b === void 0 ? void 0 : _b.methods) || []), events: mergeArrays(values.events || [], ((_c = merged[namespace]) === null || _c === void 0 ? void 0 : _c.events) || []) });
        }
    }
    return merged;
}
