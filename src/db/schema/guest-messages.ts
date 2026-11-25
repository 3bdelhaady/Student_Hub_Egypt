import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
export const guestMessages = pgTable(
  'guest_messages',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    status: text('status').notNull().default('new'),
    ipHash: text('ip_hash'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('guest_messages_created_idx').on(t.createdAt),
    index('guest_messages_email_idx').on(t.email, t.createdAt),
    index('guest_messages_ip_idx').on(t.ipHash, t.createdAt),
  ],
);
