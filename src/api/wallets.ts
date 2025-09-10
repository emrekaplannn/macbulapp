import api from '../lib/api';

export type WalletDto = {
  id: string;
  userId: string;
  balance: number;     // decimal → number
  updatedAt: number;   // epoch millis
};

export type TransactionDto = {
  id: string;
  userId: string;
  amount: number;
  type: 'LOAD' | 'PAY' | 'REFUND';
  description?: string | null;
  createdAt: number;
};

// TEMP: mock current user id until auth is implemented
export const MOCK_USER_ID = '1ae92028-ce5f-4acf-9bd5-2ebbab51246c';

// GET /wallets/user/{userId}
export async function getWalletByUser(): Promise<WalletDto> {
  const { data } = await api.get(`/wallets/user`);
  return data;
}

// GET /transactions/user/{userId}
export async function getTransactionsByUser(): Promise<TransactionDto[]> {
  const { data } = await api.get(`/transactions/user`);
  return data;
}

// POST /transactions/load
export async function topUp( amount: number, description?: string) {
  const payload = {  amount, type: 'LOAD', description };
  const { data } = await api.post('/transactions', payload);
  return data as TransactionDto;
}
