// Translate API messages at the UI boundary; unknown responses use the German fallback.
const messages = new Map<string, string>([
  [
    "No token",
    "Bitte melde dich an."
  ],
  [
    "Invalid token",
    "Deine Sitzung ist ungültig. Bitte melde dich erneut an."
  ],
  [
    "Not Authenticated",
    "Bitte melde dich an."
  ],
  [
    "Admin only",
    "Für diese Aktion sind Administratorrechte erforderlich."
  ],
  [
    "Invalid credentials",
    "Benutzername oder Passwort ungültig."
  ],
  [
    "album name is required",
    "Ein Albumname ist erforderlich."
  ],
  [
    "album name already exists",
    "Ein Album mit diesem Namen existiert bereits."
  ],
  [
    "invalid user id",
    "Ungültige Benutzer-ID."
  ],
  [
    "weak password",
    "Das Passwort muss mindestens 8 Zeichen lang sein und Großbuchstaben, Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten."
  ],
  [
    "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.",
    "Das Passwort muss mindestens 8 Zeichen lang sein und Großbuchstaben, Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten."
  ],
  [
    "User not found",
    "Benutzer nicht gefunden."
  ],
  [
    "title & file required",
    "Titel und Datei sind erforderlich."
  ],
  [
    "file required",
    "Eine Datei ist erforderlich."
  ],
  [
    "title required",
    "Ein Titel ist erforderlich."
  ],
  [
    "invalid albumId",
    "Ungültige Album-ID."
  ],
  [
    "invalid album id",
    "Ungültige Album-ID."
  ],
  [
    "albumId is invalid",
    "Ungültige Album-ID."
  ],
  [
    "Album not found",
    "Album nicht gefunden."
  ],
  [
    "photoIds is required",
    "Wähle mindestens ein Foto."
  ],
  [
    "photoIds are invalid",
    "Ungültige Fotoauswahl."
  ],
  [
    "Not found",
    "Eintrag nicht gefunden."
  ]
]);

export function germanErrorMessage(message: unknown, fallback: string): string {
  return typeof message === 'string' ? messages.get(message) ?? fallback : fallback;
}
