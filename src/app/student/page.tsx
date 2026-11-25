import { redirect } from 'next/navigation';
export default function Student() {
  redirect('/account?view=student');
}
