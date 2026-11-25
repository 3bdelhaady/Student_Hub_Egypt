'use client';
import { useActionState } from 'react';
import { requestAgentRegistration } from '@/modules/identity/registration';
import { SignupScopeSelects, type SignupInstitution } from './signup-scope-selects';
import type { UniversityOption, FacultyOption } from './academic-selects';
export function AgentRegistrationForm({
  kind,
  universities,
  faculties,
  institutions,
}: {
  kind: 'student_affairs' | 'private_sector';
  universities: UniversityOption[];
  faculties: FacultyOption[];
  institutions: SignupInstitution[];
}) {
  const [state, action, pending] = useActionState(requestAgentRegistration, {});
  return (
    <form action={action} className="form-stack">
      <SignupScopeSelects
        kind={kind}
        universities={universities}
        faculties={faculties}
        institutions={institutions}
      />
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && <p role="status">{state.success}</p>}
      <button disabled={pending} className="button primary">
        إرسال طلب التفعيل
      </button>
    </form>
  );
}
