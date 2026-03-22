export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export interface PrayerTimeEntry {
  id: string;
  mosqueId: string;
  date: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah: string | null;
  createdAt: string;
  updatedAt: string;
}
