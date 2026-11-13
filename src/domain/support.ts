const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE = 4000;

export function parseSupportMessage(
  email: string,
  message: string
): { email: string; message: string } | { error: string } {
  const cleanEmail = email.trim();
  const cleanMessage = message.trim();
  if (!EMAIL.test(cleanEmail) || cleanEmail.length > 200) {
    return { error: 'Enter an email we can reply to.' };
  }
  if (cleanMessage.length < 2) return { error: 'Write a message.' };
  if (cleanMessage.length > MAX_MESSAGE) return { error: 'That message is too long.' };
  return { email: cleanEmail, message: cleanMessage };
}
