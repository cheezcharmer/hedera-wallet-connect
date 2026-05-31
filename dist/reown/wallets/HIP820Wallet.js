import { Buffer } from 'buffer';
import { getSdkError } from '@walletconnect/utils';
import { Wallet as HederaWallet, Client, AccountId, PrecheckStatusError, } from '@hiero-ledger/sdk';
import { proto } from '@hiero-ledger/proto';
import { formatJsonRpcError, formatJsonRpcResult, } from '@walletconnect/jsonrpc-utils';
import { HederaJsonRpcMethod, base64StringToQuery, Uint8ArrayToBase64String, stringToSignerMessage, signerSignaturesToSignatureMap, getHederaError, base64StringToTransaction, signatureMapToBase64String, } from '../..';
import Provider from '../../lib/wallet/provider';
export class HIP820Wallet {
    /*
     * Set default values for chains, methods, events
     */
    constructor(wallet) {
        this.wallet = wallet;
    }
    /*
     * Hedera Wallet Signer
     */
    getHederaWallet() {
        return this.wallet;
    }
    static init({ chainId, accountId, privateKey, _provider }) {
        const network = chainId.split(':')[1];
        const client = Client.forName(network);
        const provider = _provider !== null && _provider !== void 0 ? _provider : new Provider(client);
        const wallet = new HederaWallet(accountId, privateKey, provider);
        return new HIP820Wallet(wallet);
    }
    /*
     *  Session Requests
     */
    validateParam(name, value, expectedType) {
        if (expectedType === 'array' && Array.isArray(value))
            return;
        if (typeof value === expectedType)
            return;
        throw getHederaError('INVALID_PARAMS', `Invalid paramameter value for ${name}, expected ${expectedType} but got ${typeof value}`);
    }
    parseSessionRequest(event, 
    // optional arg to throw error if request is invalid, call with shouldThrow = false when calling from rejectSessionRequest as we only need id and top to send reject response
    shouldThrow = true) {
        const { id, topic } = event;
        const { request: { method, params }, chainId, } = event.params;
        let body;
        // get account id from optional second param for transactions and queries or from transaction id
        // this allows for the case where the requested signer is not the payer, but defaults to the payer if a second param is not provided
        let signerAccountId;
        // First test for valid params for each method
        // then convert params to a body that the respective function expects
        try {
            switch (method) {
                case HederaJsonRpcMethod.GetNodeAddresses: {
                    // 1
                    if (params)
                        throw getHederaError('INVALID_PARAMS');
                    break;
                }
                case HederaJsonRpcMethod.ExecuteTransaction: {
                    // 2
                    const { transactionList } = params;
                    this.validateParam('transactionList', transactionList, 'string');
                    body = base64StringToTransaction(transactionList);
                    break;
                }
                case HederaJsonRpcMethod.SignMessage: {
                    // 3
                    const { signerAccountId: _accountId, message } = params;
                    this.validateParam('signerAccountId', _accountId, 'string');
                    this.validateParam('message', message, 'string');
                    signerAccountId = AccountId.fromString(_accountId.replace(chainId + ':', ''));
                    body = message;
                    break;
                }
                case HederaJsonRpcMethod.SignAndExecuteQuery: {
                    // 4
                    const { signerAccountId: _accountId, query } = params;
                    this.validateParam('signerAccountId', _accountId, 'string');
                    this.validateParam('query', query, 'string');
                    signerAccountId = AccountId.fromString(_accountId.replace(chainId + ':', ''));
                    body = base64StringToQuery(query);
                    break;
                }
                case HederaJsonRpcMethod.SignAndExecuteTransaction: {
                    // 5
                    const { signerAccountId: _accountId, transactionList } = params;
                    this.validateParam('signerAccountId', _accountId, 'string');
                    this.validateParam('transactionList', transactionList, 'string');
                    signerAccountId = AccountId.fromString(_accountId.replace(chainId + ':', ''));
                    body = base64StringToTransaction(transactionList);
                    break;
                }
                case HederaJsonRpcMethod.SignTransaction: {
                    // 6
                    const { signerAccountId: _accountId, transactionBody } = params;
                    this.validateParam('signerAccountId', _accountId, 'string');
                    this.validateParam('transactionBody', transactionBody, 'string');
                    signerAccountId = AccountId.fromString(_accountId.replace(chainId + ':', ''));
                    body = Buffer.from(transactionBody, 'base64');
                    break;
                }
                default:
                    throw getSdkError('INVALID_METHOD');
            }
            // error parsing request params
        }
        catch (e) {
            if (shouldThrow)
                throw e;
        }
        return {
            method: method,
            chainId: chainId,
            id,
            topic,
            body,
            accountId: signerAccountId,
        };
    }
    async approveSessionRequest(event) {
        const { method, id, body } = this.parseSessionRequest(event);
        const response = await this[method](id, body);
        return response;
    }
    rejectSessionRequest(requestEvent) {
        const { id } = requestEvent;
        return formatJsonRpcError(id, getSdkError('USER_REJECTED').message);
    }
    /*
     * JSON RPC Methods
     */
    // 1. hedera_getNodeAddresses
    async hedera_getNodeAddresses(id, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _) {
        const nodesAccountIds = this.wallet.getNetwork();
        const nodes = Object.values(nodesAccountIds).map((nodeAccountId) => nodeAccountId.toString());
        return formatJsonRpcResult(id, {
            nodes,
        });
    }
    // 2. hedera_executeTransaction
    async hedera_executeTransaction(id, signedTransaction) {
        try {
            const response = await this.wallet.call(signedTransaction);
            return formatJsonRpcResult(id, response.toJSON());
        }
        catch (e) {
            if (e instanceof PrecheckStatusError) {
                // HIP-820 error format
                return formatJsonRpcError(id, {
                    code: 9000,
                    message: e.message,
                    data: e.status._code.toString(),
                });
            }
            return formatJsonRpcError(id, { code: 9000, message: 'Unknown Error' });
        }
    }
    // 3. hedera_signMessage
    async hedera_signMessage(id, body) {
        // signer takes an array of Uint8Arrays though spec allows for 1 message to be signed
        const signerSignatures = await this.wallet.sign(stringToSignerMessage(body));
        const _signatureMap = proto.SignatureMap.create(signerSignaturesToSignatureMap(signerSignatures));
        const signatureMap = signatureMapToBase64String(_signatureMap);
        return formatJsonRpcResult(id, {
            signatureMap,
        });
    }
    // 4. hedera_signAndExecuteQuery
    async hedera_signAndExecuteQuery(id, body) {
        /*
         * Can be used with return values the have a toBytes method implemented
         * For example:
         * https://github.com/hashgraph/hedera-sdk-js/blob/c4438cbaa38074d8bfc934dba84e3b430344ed89/src/account/AccountInfo.js#L402
         */
        try {
            const queryResult = await body.executeWithSigner(this.wallet);
            let queryResponse = '';
            if (Array.isArray(queryResult)) {
                queryResponse = queryResult
                    .map((qr) => Uint8ArrayToBase64String(qr.toBytes()))
                    .join(',');
            }
            else {
                queryResponse = Uint8ArrayToBase64String(queryResult.toBytes());
            }
            return formatJsonRpcResult(id, {
                response: queryResponse,
            });
        }
        catch (e) {
            if (e instanceof PrecheckStatusError) {
                // HIP-820 error format
                return formatJsonRpcError(id, {
                    code: 9000,
                    message: e.message,
                    data: e.status._code.toString(),
                });
            }
            return formatJsonRpcError(id, { code: 9000, message: 'Unknown Error' });
        }
    }
    // 5. hedera_signAndExecuteTransaction
    async hedera_signAndExecuteTransaction(id, transaction) {
        // check transaction is incomplete (HIP-745)
        if (!transaction.isFrozen()) {
            // set multiple nodeAccountIds and transactionId if not present
            await transaction.freezeWithSigner(this.wallet);
        }
        const signedTransaction = await transaction.signWithSigner(this.wallet);
        try {
            const response = await signedTransaction.executeWithSigner(this.wallet);
            return formatJsonRpcResult(id, response.toJSON());
        }
        catch (e) {
            if (e instanceof PrecheckStatusError) {
                // HIP-820 error format
                return formatJsonRpcError(id, {
                    code: 9000,
                    message: e.message,
                    data: e.status._code.toString(),
                });
            }
            return formatJsonRpcError(id, { code: 9000, message: 'Unknown Error' });
        }
    }
    // 6. hedera_signTransaction
    async hedera_signTransaction(id, body) {
        const signerSignatures = await this.wallet.sign([body]);
        const _signatureMap = proto.SignatureMap.create(signerSignaturesToSignatureMap(signerSignatures));
        const signatureMap = signatureMapToBase64String(_signatureMap);
        return formatJsonRpcResult(id, {
            signatureMap,
        });
    }
}
export default HIP820Wallet;
