import { AccountBalance, LedgerId } from '@hiero-ledger/sdk';
export declare function getAccountBalance(ledgerId: LedgerId, address: string): Promise<AccountBalance | null>;
