/**
 * A readable message from anything that was thrown: an Error, a Supabase error object
 * (a plain object with a `message`), or a string. Falls back to `fallback` when there is none.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
