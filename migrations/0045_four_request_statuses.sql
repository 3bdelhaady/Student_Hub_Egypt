DELETE FROM portal_requests WHERE status IN ('rejected','cancelled');
ALTER TABLE portal_requests ADD CONSTRAINT portal_requests_four_statuses CHECK (status IN ('pending','reviewing','accepted','completed'));
