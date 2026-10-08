export function notificationGroup(date: string, now = new Date()): string {
  const day = new Date(date); day.setHours(0, 0, 0, 0);
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const week = new Date(today); week.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  if (day >= today) return "Hoy";
  if (day >= yesterday) return "Ayer";
  if (day >= week) return "Esta semana";
  return "Antes";
}
