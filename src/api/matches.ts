// src/api/matches.ts
import api from '../lib/api';

export type Match = {
  id: string;
  fieldName: string;
  city: string;
  matchTimestamp: number;
  pricePerUser: number;
  totalSlots?: number;
  filledSlots?: number;     // ✅ eklendi
};

export type MatchSlots = {
  matchId: string;
  totalSlots: number;
  paidCount: number;
  remaining: number;
  full: boolean;
};

export async function listMatches(): Promise<Match[]> {
  const { data } = await api.get('/matches');           // ⬅️ baseURL’in /v1 içermiyorsa bunu kullan
  return data;
}

export async function getMatchById(id: string): Promise<Match> {
  const { data } = await api.get(`/matches/${id}`);
  return data;
}

export async function getMatchSlots(id: string): Promise<MatchSlots> {
  const { data } = await api.get(`/matches/${id}/slots`);
  return data;
}
