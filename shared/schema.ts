import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - updated for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Legacy fields for backward compatibility (deprecated)
  replitId: text("replit_id").unique(),
  username: text("username"),
  avatarUrl: text("avatar_url"),
});

export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  nodes: jsonb("nodes").notNull().default([]),
  edges: jsonb("edges").notNull().default([]),
  isTemplate: boolean("is_template").default(false).notNull(),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull(),
  description: text("description"),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  systemPrompt: text("system_prompt"),
  temperature: integer("temperature").default(70),
  maxTokens: integer("max_tokens").default(1000),
  capabilities: jsonb("capabilities").default([]),
  nodeId: text("node_id").notNull(),
  position: jsonb("position").notNull().default({ x: 0, y: 0 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const executions = pgTable("executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  input: jsonb("input"),
  output: jsonb("output"),
  error: text("error"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"),
});

export const agentMessages = pgTable("agent_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  executionId: varchar("execution_id").notNull().references(() => executions.id, { onDelete: "cascade" }),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count"),
  fromAgentId: varchar("from_agent_id"),
  toAgentId: varchar("to_agent_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const executionLogs = pgTable("execution_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  executionId: varchar("execution_id").notNull().references(() => executions.id, { onDelete: "cascade" }),
  agentId: varchar("agent_id").references(() => agents.id, { onDelete: "set null" }),
  level: text("level").notNull().default("info"),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  usageCount: integer("usage_count").default(0).notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assistantChats = pgTable("assistant_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workflowId: varchar("workflow_id").references(() => workflows.id, { onDelete: "set null" }),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const knowledgeEntries = pgTable("knowledge_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentType: text("agent_type").notNull(), // coordinator, coder, researcher, database, security, custom
  category: text("category").notNull(), // general, coding, research, security, database, etc
  content: text("content").notNull(), // the actual knowledge/learning
  context: text("context"), // optional context about when/how this was learned
  sourceExecutionId: varchar("source_execution_id").references(() => executions.id, { onDelete: "set null" }),
  sourceAgentId: varchar("source_agent_id").references(() => agents.id, { onDelete: "set null" }),
  confidence: integer("confidence").default(80), // 0-100 confidence score
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_knowledge_query").on(table.userId, table.agentType, table.category, table.confidence.desc()),
]);

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertWorkflowSchema = createInsertSchema(workflows).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAgentSchema = createInsertSchema(agents).omit({ id: true, createdAt: true });
export const insertExecutionSchema = createInsertSchema(executions).omit({ id: true, startedAt: true, completedAt: true, duration: true });
export const insertAgentMessageSchema = createInsertSchema(agentMessages).omit({ id: true, timestamp: true });
export const insertExecutionLogSchema = createInsertSchema(executionLogs).omit({ id: true, timestamp: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true, usageCount: true });
export const insertAssistantChatSchema = createInsertSchema(assistantChats).omit({ id: true, createdAt: true, updatedAt: true });
export const insertKnowledgeEntrySchema = createInsertSchema(knowledgeEntries).omit({ id: true, createdAt: true, updatedAt: true });

// Phase 3A: Workflow Versions Table
export const workflowVersions: any = pgTable("workflow_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  commitMessage: text("commit_message"),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  workflowData: jsonb("workflow_data").notNull(), // Stores nodes, edges, agents
  parentVersionId: varchar("parent_version_id"),
  tag: text("tag"), // v1.0, production, stable, etc.
  executionCount: integer("execution_count").default(0).notNull(),
  successRate: integer("success_rate").default(0), // 0-100
  avgDuration: integer("avg_duration"), // milliseconds
}, (table: any) => [
  index("idx_workflow_versions").on(table.workflowId, table.version.desc()),
]);

// Phase 3A: Workflow Schedules Table
export const workflowSchedules = pgTable("workflow_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  cronExpression: text("cron_expression").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  timezone: text("timezone").default("UTC").notNull(),
  nextRunAt: timestamp("next_run_at"),
  lastRunAt: timestamp("last_run_at"),
  executionCount: integer("execution_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Phase 3A: Workflow Webhooks Table
export const workflowWebhooks = pgTable("workflow_webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  webhookUrl: text("webhook_url").notNull(),
  secretKey: text("secret_key").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  triggerCount: integer("trigger_count").default(0).notNull(),
  lastTriggeredAt: timestamp("last_triggered_at"),
  ipWhitelist: jsonb("ip_whitelist"), // Array of allowed IPs
  payloadTransformer: jsonb("payload_transformer"), // Mapping configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_webhook_url").on(table.webhookUrl),
]);

// Phase 3A: Execution Costs Table
export const executionCosts = pgTable("execution_costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  executionId: varchar("execution_id").notNull().references(() => executions.id, { onDelete: "cascade" }),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").default(0).notNull(),
  outputTokens: integer("output_tokens").default(0).notNull(),
  totalTokens: integer("total_tokens").default(0).notNull(),
  estimatedCost: integer("estimated_cost").default(0).notNull(), // Cost in cents
  currency: text("currency").default("USD").notNull(),
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_execution_costs").on(table.executionId, table.agentId),
]);

// Phase 3A: Provider Pricing Table
export const providerPricing = pgTable("provider_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  inputTokenPrice: integer("input_token_price").notNull(), // Price per 1M tokens in cents
  outputTokenPrice: integer("output_token_price").notNull(), // Price per 1M tokens in cents
  currency: text("currency").default("USD").notNull(),
  effectiveDate: timestamp("effective_date").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_provider_pricing").on(table.provider, table.model),
]);

export const insertWorkflowVersionSchema = createInsertSchema(workflowVersions).omit({ id: true, createdAt: true });
export const insertWorkflowScheduleSchema = createInsertSchema(workflowSchedules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkflowWebhookSchema = createInsertSchema(workflowWebhooks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertExecutionCostSchema = createInsertSchema(executionCosts).omit({ id: true, calculatedAt: true });
export const insertProviderPricingSchema = createInsertSchema(providerPricing).omit({ id: true, effectiveDate: true, updatedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertExecution = z.infer<typeof insertExecutionSchema>;
export type Execution = typeof executions.$inferSelect;

export type InsertAgentMessage = z.infer<typeof insertAgentMessageSchema>;
export type AgentMessage = typeof agentMessages.$inferSelect;

export type InsertExecutionLog = z.infer<typeof insertExecutionLogSchema>;
export type ExecutionLog = typeof executionLogs.$inferSelect;

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

export type InsertAssistantChat = z.infer<typeof insertAssistantChatSchema>;
export type AssistantChat = typeof assistantChats.$inferSelect;

export type InsertKnowledgeEntry = z.infer<typeof insertKnowledgeEntrySchema>;
export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;

export type InsertWorkflowVersion = z.infer<typeof insertWorkflowVersionSchema>;
export type WorkflowVersion = typeof workflowVersions.$inferSelect;

export type InsertWorkflowSchedule = z.infer<typeof insertWorkflowScheduleSchema>;
export type WorkflowSchedule = typeof workflowSchedules.$inferSelect;

export type InsertWorkflowWebhook = z.infer<typeof insertWorkflowWebhookSchema>;
export type WorkflowWebhook = typeof workflowWebhooks.$inferSelect;

export type InsertExecutionCost = z.infer<typeof insertExecutionCostSchema>;
export type ExecutionCost = typeof executionCosts.$inferSelect;

export type InsertProviderPricing = z.infer<typeof insertProviderPricingSchema>;
export type ProviderPricing = typeof providerPricing.$inferSelect;
