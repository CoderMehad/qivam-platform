export interface Invitation {
  id: string;
  email: string;
  mosqueId: string;
  invitedBy: string;
  token: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export type InvitationPublic = Omit<Invitation, "token">;
