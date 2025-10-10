// src/api/matchParticipants.ts
import api from '../lib/api';

export type CreateMatchParticipantReq = {
  matchId: string;
  userId: string;
  teamId?: string | null;
  joinedAt?: number | null;
  hasPaid?: boolean | null;
};

export async function createMatchParticipant(req: CreateMatchParticipantReq) {
  const { data } = await api.post('/match-participants', req);
  return data; // MatchParticipantDto
}
