// Utilidades de validación y sanitización de entradas del lado del cliente.
// Nota: esto es una capa de defensa en profundidad para UX/seguridad básica;
// la validación/sanitización autoritativa siempre debe hacerse en el backend.

const NAME_REGEX = /^[a-zA-ZÀ-ÿñÑ\s'-]{2,100}$/;
const EMAIL_REGEX = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const CONTROL_CHARS_REGEX = new RegExp('[\\u0000-\\u001F\\u007F]', 'g');

/** Elimina caracteres de control y marcado peligroso (<, >) de una cadena. */
export function sanitizeInput(value: string): string {
  return value
    .replace(CONTROL_CHARS_REGEX, '')
    .replace(/[<>]/g, '') // evita inyección básica de etiquetas
    .trim();
}

export function isValidName(name: string): boolean {
  return NAME_REGEX.test(name);
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 150;
}

/** Evita contraseñas triviales que contengan el nombre o el correo del usuario. */
export function passwordContainsPersonalInfo(
  password: string,
  nombre: string,
  email: string
): boolean {
  const pwLower = password.toLowerCase();
  const nameParts = nombre.toLowerCase().split(/\s+/).filter((p) => p.length >= 3);
  const emailLocalPart = email.toLowerCase().split('@')[0];

  if (emailLocalPart && emailLocalPart.length >= 3 && pwLower.includes(emailLocalPart)) {
    return true;
  }

  return nameParts.some((part) => pwLower.includes(part));
}
