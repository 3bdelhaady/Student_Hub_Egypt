import { randomUUID } from 'node:crypto';
// Never serialize caught errors, request bodies, headers, URLs or identities here.
export function diagnosticEvent(scope: string) {
  return {
    event: 'operation_failed',
    scope,
    incidentId: randomUUID(),
    at: new Date().toISOString(),
  };
}
export function reportFailure(scope: string) {
  const event = diagnosticEvent(scope);
  console.error(JSON.stringify(event));
  return event.incidentId;
}
