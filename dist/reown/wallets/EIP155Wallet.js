import { JsonRpcProvider, Wallet, Transaction, } from 'ethers';
import { formatJsonRpcError, formatJsonRpcResult, } from '@walletconnect/jsonrpc-utils';
import { getSdkError } from '@walletconnect/utils';
import { Eip155JsonRpcMethod, HederaChainDefinition, getSignParamsMessage, getSignTypedDataParamsData, } from '..';
/**
 * @deprecated EIP155Wallet is deprecated and will be removed in the next major version.
 * Use `WagmiAdapter` from `@reown/appkit-adapter-wagmi` for EVM wallet connectivity instead.
 */
export class EIP155Wallet {
    constructor(wallet) {
        console.warn('EIP155Wallet is deprecated and will be removed in the next major version. ' +
            'Use WagmiAdapter from @reown/appkit-adapter-wagmi for EVM wallet connectivity instead.');
        this.wallet = wallet;
    }
    connect(provider) {
        return this.wallet.connect(provider);
    }
    personal_sign(message) {
        return this.eth_sign(message);
    }
    eth_sign(message) {
        return this.wallet.signMessage(message);
    }
    eth_signTypedData(domain, types, data) {
        return this.wallet.signTypedData(domain, types, data);
    }
    eth_signTypedData_v3(domain, types, data) {
        return this.eth_signTypedData(domain, types, data);
    }
    eth_signTypedData_v4(domain, types, data) {
        return this.eth_signTypedData(domain, types, data);
    }
    async eth_signTransaction(transaction, provider) {
        // Populate transaction
        const preparedTransaction = await this.connect(provider).populateTransaction(transaction);
        delete preparedTransaction.from;
        const txObj = Transaction.from(preparedTransaction);
        return this.wallet.signTransaction(txObj);
    }
    eth_sendTransaction(transaction, provider) {
        return this.connect(provider).sendTransaction(transaction);
    }
    eth_sendRawTransaction(rawTransaction, provider) {
        return provider.broadcastTransaction(rawTransaction);
    }
    static init({ privateKey }) {
        const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
        return new EIP155Wallet(wallet);
    }
    getPrivateKey() {
        return this.wallet.privateKey;
    }
    getEvmAddress() {
        return this.wallet.address;
    }
    async approveSessionRequest(requestEvent) {
        const { params, id } = requestEvent;
        const { chainId, request } = params;
        const networks = Object.values(HederaChainDefinition.EVM);
        const caipNetwork = networks.find((network) => network.caipNetworkId == chainId);
        if (!caipNetwork) {
            return formatJsonRpcError(id, 'Unsupported network');
        }
        switch (request.method) {
            case Eip155JsonRpcMethod.PersonalSign:
            case Eip155JsonRpcMethod.Sign:
                try {
                    const message = getSignParamsMessage(request.params);
                    const signedMessage = await this.eth_sign(message);
                    return formatJsonRpcResult(id, signedMessage);
                }
                catch (error) {
                    if (!(error instanceof Error)) {
                        return formatJsonRpcError(id, 'Failed to sign message');
                    }
                    return formatJsonRpcError(id, error.message);
                }
            case Eip155JsonRpcMethod.SignTypedData:
            case Eip155JsonRpcMethod.SignTypedDataV3:
            case Eip155JsonRpcMethod.SignTypedDataV4:
                try {
                    const { domain, types, message: data } = getSignTypedDataParamsData(request.params);
                    // https://github.com/ethers-io/ethers.js/issues/687#issuecomment-714069471
                    delete types.EIP712Domain;
                    const signedData = await this.eth_signTypedData(domain, types, data);
                    return formatJsonRpcResult(id, signedData);
                }
                catch (error) {
                    if (!(error instanceof Error)) {
                        return formatJsonRpcError(id, 'Failed to sign typed data');
                    }
                    return formatJsonRpcError(id, error.message);
                }
            case Eip155JsonRpcMethod.SendRawTransaction:
            case Eip155JsonRpcMethod.SendTransaction:
                try {
                    const provider = new JsonRpcProvider(caipNetwork.rpcUrls.default.http[0]);
                    const sendTransaction = request.params[0];
                    const txResponse = await this[request.method](sendTransaction, provider);
                    const txHash = typeof txResponse === 'string' ? txResponse : txResponse === null || txResponse === void 0 ? void 0 : txResponse.hash;
                    return formatJsonRpcResult(id, txHash);
                }
                catch (error) {
                    return formatJsonRpcError(id, error instanceof Error ? error.message : 'Failed to send transaction');
                }
            case Eip155JsonRpcMethod.SignTransaction:
                try {
                    const provider = new JsonRpcProvider(caipNetwork.rpcUrls.default.http[0]);
                    const signTransaction = request.params[0];
                    const signature = await this.eth_signTransaction(signTransaction, provider);
                    return formatJsonRpcResult(id, signature);
                }
                catch (error) {
                    if (!(error instanceof Error)) {
                        return formatJsonRpcError(id, 'Failed to sign transaction');
                    }
                    return formatJsonRpcError(id, error.message);
                }
            default:
                throw new Error(getSdkError('INVALID_METHOD').message);
        }
    }
    rejectSessionRequest(requestEvent) {
        const { id } = requestEvent;
        return formatJsonRpcError(id, getSdkError('USER_REJECTED').message);
    }
}
