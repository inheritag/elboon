import { getLocalStore } from '../../../libs/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const emails = await getLocalStore().listEmails();
  return { emails };
};
