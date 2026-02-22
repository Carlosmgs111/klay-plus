export const ProfileStatus = {
  Active: "ACTIVE",
  Deprecated: "DEPRECATED",
} as const;

export type ProfileStatus = (typeof ProfileStatus)[keyof typeof ProfileStatus];
