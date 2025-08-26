import api from './client';

export type Match = {
  id: string;
  fieldName: string;
  city: string;
  matchTimestamp: number;
  pricePerUser: number;
  totalSlots?: number;
  filledSlots?: number;
};

export async function listMatches(): Promise<Match[]> {
  const { data } = await api.get('/matches'); // adjust if your path differs
  return data;
}

export async function getMatchById(id: string): Promise<Match> {
  const { data } = await api.get(`/matches/${id}`);
  return data;
}