// Read-only inspection: no passwords are needed, tried, or printed.
process.env.DEMO_PROVISION_STATUS_ONLY = 'true';
void import('./provision-demo');
