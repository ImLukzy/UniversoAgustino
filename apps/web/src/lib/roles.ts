// Etiqueta visible de cada rol (única fuente para panel, cuenta y ajustes).
export const ROLE_LABEL: Record<string, string> = { admin: "Administrador", moderator: "Moderador", creator: "Creador", student: "Estudiante" };
export const roleLabel = (role: string) => ROLE_LABEL[role] ?? role;
