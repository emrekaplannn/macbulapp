// src/api/matches.ts
import api from '../lib/api';


export type MatchSlots = {
  matchId: string;
  totalSlots: number;
  paidCount: number;
  remaining: number;
  full: boolean;
};

export type Match = {
  id: string;
  fieldName: string;
  city: string;
  matchTimestamp: number;
  pricePerUser: number;
  totalSlots?: number;
  filledSlots?: number;
  isUserJoined?: boolean; // ✅
};

export async function listMatches(fromTs?: number): Promise<Match[]> {
  const { data } = await api.post('/matches/list-filtered', {
    fromTimestamp: fromTs ?? Date.now(),
  });
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
