import { fail } from '@sveltejs/kit';
import { parseSupportMessage } from '../../domain/support';
import { sendSupportEmail } from '../../libs/email';
import type { Actions } from './$types';

export const actions: Actions = {
  send: async ({ request }) => {
    const form = await request.formData();
    if (String(form.get('company') ?? '').trim()) return { sent: true };

    const parsed = parseSupportMessage(String(form.get('email') ?? ''), String(form.get('message') ?? ''));
    if ('error' in parsed) {
      return fail(400, { error: parsed.error });
    }

    try {
      await sendSupportEmail(parsed);
    } catch (err) {
      console.error('[support email]', err instanceof Error ? err.name : 'send failed');
      return fail(500, { error: 'We could not send that. Try again.' });
    }

    return { sent: true };
  }
};
