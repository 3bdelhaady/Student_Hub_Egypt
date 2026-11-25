'use server';
import type { FormState } from '../shared/form-state';
export async function saveNationalId(_: FormState, _form: FormData): Promise<FormState> {
  return { error: 'توقف استقبال الرقم القومي. استخدم كود الحساب من الملف الشخصي.' };
}
