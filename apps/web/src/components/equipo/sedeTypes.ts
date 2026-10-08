export interface Sede { id: string; name: string; address: string; meetingPoint: string; photoUrl?: string | null; active: boolean }
export interface Hours { weekday: number; opens: number; closes: number; special: boolean }
export interface Holiday { id: string; date: string; reason: string }
export interface Schedule { hours: Hours[]; holidays: Holiday[]; timezone: string }
export interface Shift { id: string; userId: string; sedeId: string; weekday: number; startsMin: number; endsMin: number;
  sede: { name: string }; user: { email: string; profile?: { fullName?: string | null } | null } }
export interface StaffChoice { id: string; email: string; fullName: string }
export type SaveSchedule = (method: "post" | "patch" | "put" | "delete", path: string, body?: unknown) => Promise<boolean>;
export const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const timeText = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
export const timeMinutes = (text: string) => { const [h, m] = text.split(":").map(Number); return h * 60 + m; };
