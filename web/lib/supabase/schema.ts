import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const managedAgentSession = pgTable("managed_agent_session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  anthropicSessionId: text("anthropic_session_id").notNull().unique(),
  title: text("title").notNull().default("New chat"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  agentId: text("agent_id").notNull(),
  environmentId: text("environment_id").notNull(),
  workflowRunId: text("workflow_run_id"),
});
