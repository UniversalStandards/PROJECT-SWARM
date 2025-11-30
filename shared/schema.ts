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
  // GitHub OAuth tokens (per-user)
  githubAccessToken: text("github_access_token"),
  githubRefreshToken: text("github_refresh_token"),
  githubTokenExpiry: timestamp("github_token_expiry"),
  // API Keys (encrypted)
  openaiApiKey: text("openai_api_key"),
  anthropicApiKey: text("anthropic_api_key"),
  geminiApiKey: text("gemini_api_key"),
  // User Preferences
  defaultProvider: text("default_provider").default("openai"),
  defaultModel: text("default_model"),
  theme: text("theme").default("system"),
  emailNotifications: boolean("email_notifications").default(true),
  inAppNotifications: boolean("in_app_notifications").default(true),
  executionTimeout: integer("execution_timeout").default(300),
  autoSaveInterval: integer("auto_save_interval").default(30),
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
  // Advanced settings
  topP: integer("top_p"),
  frequencyPenalty: integer("frequency_penalty"),
  presencePenalty: integer("presence_penalty"),
  stopSequences: jsonb("stop_sequences").default([]),
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
  stepIndex: integer("step_index"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_execution_logs_execution_id").on(table.executionId),
  index("idx_execution_logs_timestamp").on(table.timestamp),
]);

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

// Phase 3A: Workflow Versioning
export const workflowVersions = pgTable("workflow_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  data: jsonb("data").notNull(), // Complete workflow snapshot (nodes, edges, config)
  commitMessage: text("commit_message"),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_workflow_versions").on(table.workflowId, table.version.desc()),
]);

// Phase 3A: Scheduled Executions
export const workflowSchedules = pgTable("workflow_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  cronExpression: text("cron_expression").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  enabled: boolean("enabled").default(true).notNull(),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Phase 3A: Webhook Triggers
export const workflowWebhooks = pgTable("workflow_webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  url: text("url").notNull().unique(), // Unique webhook URL path
  secret: text("secret").notNull(), // HMAC secret for validation
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Phase 3A: Webhook Logs
export const webhookLogs = pgTable("webhook_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookId: varchar("webhook_id").notNull().references(() => workflowWebhooks.id, { onDelete: "cascade" }),
  payload: jsonb("payload"),
  headers: jsonb("headers"),
  status: text("status").notNull(), // success, failed, invalid
  error: text("error"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Phase 3A: Workflow Input/Output Schemas
export const workflowSchemas = pgTable("workflow_schemas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }).unique(),
  inputSchema: jsonb("input_schema"), // JSON Schema definition
  outputSchema: jsonb("output_schema"), // JSON Schema definition
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Phase 3A: Cost Tracking
export const executionCosts = pgTable("execution_costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  executionId: varchar("execution_id").notNull().references(() => executions.id, { onDelete: "cascade" }),
  agentId: varchar("agent_id").references(() => agents.id, { onDelete: "set null" }),
  provider: text("provider").notNull(), // openai, anthropic, gemini
  model: text("model").notNull(),
  promptTokens: integer("prompt_tokens").default(0).notNull(),
  completionTokens: integer("completion_tokens").default(0).notNull(),
  totalTokens: integer("total_tokens").default(0).notNull(),
  costUsd: integer("cost_usd").default(0).notNull(), // Cost in micro-cents (1/1000000 of dollar)
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_execution_costs").on(table.executionId, table.timestamp.desc()),
]);

export const providerPricing = pgTable("provider_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(), // openai, anthropic, gemini
  model: text("model").notNull(),
  inputTokenPrice: integer("input_token_price").notNull(), // Price per 1M tokens in cents
  outputTokenPrice: integer("output_token_price").notNull(), // Price per 1M tokens in cents
  currency: text("currency").default("USD").notNull(),
  effectiveDate: timestamp("effective_date").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_provider_pricing").on(table.provider, table.model),
]);

// Phase 3A: Workflow Tags
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").default("#3b82f6").notNull(), // Hex color
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workflowTags = pgTable("workflow_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_workflow_tags").on(table.workflowId, table.tagId),
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
export const insertWorkflowVersionSchema = createInsertSchema(workflowVersions).omit({ id: true, createdAt: true });
export const insertWorkflowScheduleSchema = createInsertSchema(workflowSchedules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkflowWebhookSchema = createInsertSchema(workflowWebhooks).omit({ id: true, createdAt: true });
export const insertWebhookLogSchema = createInsertSchema(webhookLogs).omit({ id: true, timestamp: true });
export const insertWorkflowSchemaSchema = createInsertSchema(workflowSchemas).omit({ id: true, createdAt: true, updatedAt: true });
export const insertExecutionCostSchema = createInsertSchema(executionCosts).omit({ id: true, timestamp: true });
export const insertProviderPricingSchema = createInsertSchema(providerPricing).omit({ id: true, effectiveDate: true, updatedAt: true });
export const insertTagSchema = createInsertSchema(tags).omit({ id: true, createdAt: true });
export const insertWorkflowTagSchema = createInsertSchema(workflowTags).omit({ id: true, createdAt: true });

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

export type InsertWebhookLog = z.infer<typeof insertWebhookLogSchema>;
export type WebhookLog = typeof webhookLogs.$inferSelect;

export type InsertWorkflowSchema = z.infer<typeof insertWorkflowSchemaSchema>;
export type WorkflowSchemaType = typeof workflowSchemas.$inferSelect;

export type InsertExecutionCost = z.infer<typeof insertExecutionCostSchema>;
export type ExecutionCost = typeof executionCosts.$inferSelect;

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export type InsertWorkflowTag = z.infer<typeof insertWorkflowTagSchema>;
export type WorkflowTag = typeof workflowTags.$inferSelect;
export type InsertExecutionCost = z.infer<typeof insertExecutionCostSchema>;
export type ExecutionCost = typeof executionCosts.$inferSelect;

export type InsertProviderPricing = z.infer<typeof insertProviderPricingSchema>;
export type ProviderPricing = typeof providerPricing.$inferSelect;
