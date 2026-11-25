export function isAgentMode(
  v:
    | { institutionAgent?: unknown; membership?: { role: string }; activeMode: string }
    | null
    | undefined,
) {
  return !!v?.institutionAgent && (v.membership?.role !== 'student' || v.activeMode !== 'student');
}
