import type {
  User,
  InsertUser,
  UpsertUser,
  Workflow,
  InsertWorkflow,
  Agent,
  InsertAgent,
  Execution,
  InsertExecution,
  AgentMessage,
  InsertAgentMessage,
  ExecutionLog,
  InsertExecutionLog,
  Template,
  InsertTemplate,
  AssistantChat,
  InsertAssistantChat,
  KnowledgeEntry,
  InsertKnowledgeEntry,
  WorkflowVersion,
  InsertWorkflowVersion,
  WorkflowSchedule,
  InsertWorkflowSchedule,
  WorkflowWebhook,
  InsertWorkflowWebhook,
  WebhookLog,
  InsertWebhookLog,
  WorkflowSchemaType,
  InsertWorkflowSchema,
  ExecutionCost,
  InsertExecutionCost,
  Tag,
  InsertTag,
  WorkflowTag,
  InsertWorkflowTag,
} from "@shared/schema";
import { db } from "./db";
import { 
  users, 
  workflows, 
  agents, 
  executions, 
  agentMessages, 
  executionLogs, 
  templates,
  assistantChats,
  knowledgeEntries,
  workflowVersions,
  workflowSchedules,
  workflowWebhooks,
  webhookLogs,
  workflowSchemas,
  executionCosts,
  tags,
  workflowTags,
} from "@shared/schema";
import { eq, desc, and, or, inArray } from "drizzle-orm";

export interface IStorage {
  // Users (Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  // Legacy user methods (for backward compatibility)
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | undefined>;
  
  // Workflows
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  getWorkflowById(id: string): Promise<Workflow | undefined>;
  getWorkflowsByUserId(userId: string): Promise<Workflow[]>;
  updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<void>;
  
  // Agents
  createAgent(agent: InsertAgent): Promise<Agent>;
  getAgentById(id: string): Promise<Agent | undefined>;
  getAgentsByWorkflowId(workflowId: string): Promise<Agent[]>;
  updateAgent(id: string, agent: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<void>;
  
  // Executions
  createExecution(execution: InsertExecution): Promise<Execution>;
  getExecutionById(id: string): Promise<Execution | undefined>;
  getExecutionsByWorkflowId(workflowId: string): Promise<Execution[]>;
  getExecutionsByUserId(userId: string): Promise<Execution[]>;
  updateExecution(id: string, execution: Partial<InsertExecution>): Promise<Execution | undefined>;
  deleteExecution(id: string): Promise<void>;
  deleteExecutionsByUserId(userId: string): Promise<number>;
  
  // Agent Messages
  createAgentMessage(message: InsertAgentMessage): Promise<AgentMessage>;
  getMessagesByExecutionId(executionId: string): Promise<AgentMessage[]>;
  
  // Execution Logs
  createExecutionLog(log: InsertExecutionLog): Promise<ExecutionLog>;
  getLogsByExecutionId(executionId: string, filters?: {
    level?: string;
    agentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExecutionLog[]>;
  
  // Templates
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplateById(id: string): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  getFeaturedTemplates(): Promise<Template[]>;
  updateTemplate(id: string, template: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: string): Promise<void>;
  updateTemplateUsageCount(id: string): Promise<void>;
  
  // Assistant Chats
  createAssistantChat(chat: InsertAssistantChat): Promise<AssistantChat>;
  getAssistantChatById(id: string): Promise<AssistantChat | undefined>;
  getAssistantChatsByUserId(userId: string): Promise<AssistantChat[]>;
  updateAssistantChat(id: string, chat: Partial<InsertAssistantChat>): Promise<AssistantChat | undefined>;
  
  // Knowledge Base
  createKnowledgeEntry(entry: InsertKnowledgeEntry): Promise<KnowledgeEntry>;
  getKnowledgeByUserId(userId: string): Promise<KnowledgeEntry[]>;
  getKnowledgeByAgentType(userId: string, agentType: string): Promise<KnowledgeEntry[]>;
  getKnowledgeByCategory(userId: string, category: string): Promise<KnowledgeEntry[]>;
  getRelevantKnowledge(userId: string, agentType: string, categories: string[]): Promise<KnowledgeEntry[]>;
  
  // Workflow Versions
  createWorkflowVersion(version: InsertWorkflowVersion): Promise<WorkflowVersion>;
  getWorkflowVersions(workflowId: string): Promise<WorkflowVersion[]>;
  getWorkflowVersionById(id: string): Promise<WorkflowVersion | undefined>;
  setActiveVersion(workflowId: string, versionId: string): Promise<void>;
  
  // Workflow Schedules
  createWorkflowSchedule(schedule: InsertWorkflowSchedule): Promise<WorkflowSchedule>;
  getWorkflowSchedules(workflowId: string): Promise<WorkflowSchedule[]>;
  getWorkflowScheduleById(id: string): Promise<WorkflowSchedule | undefined>;
  updateWorkflowSchedule(id: string, schedule: Partial<InsertWorkflowSchedule>): Promise<WorkflowSchedule | undefined>;
  deleteWorkflowSchedule(id: string): Promise<void>;
  getAllEnabledSchedules(): Promise<WorkflowSchedule[]>;
  
  // Workflow Webhooks
  createWorkflowWebhook(webhook: InsertWorkflowWebhook): Promise<WorkflowWebhook>;
  getWorkflowWebhooks(workflowId: string): Promise<WorkflowWebhook[]>;
  getWorkflowWebhookById(id: string): Promise<WorkflowWebhook | undefined>;
  getWorkflowWebhookByUrl(url: string): Promise<WorkflowWebhook | undefined>;
  updateWorkflowWebhook(id: string, webhook: Partial<InsertWorkflowWebhook>): Promise<WorkflowWebhook | undefined>;
  deleteWorkflowWebhook(id: string): Promise<void>;
  createWebhookLog(log: InsertWebhookLog): Promise<WebhookLog>;
  getWebhookLogs(webhookId: string): Promise<WebhookLog[]>;
  
  // Workflow Schemas
  createWorkflowSchema(schema: InsertWorkflowSchema): Promise<WorkflowSchemaType>;
  getWorkflowSchema(workflowId: string): Promise<WorkflowSchemaType | undefined>;
  updateWorkflowSchema(workflowId: string, schema: Partial<InsertWorkflowSchema>): Promise<WorkflowSchemaType | undefined>;
  
  // Execution Costs
  createExecutionCost(cost: InsertExecutionCost): Promise<ExecutionCost>;
  getExecutionCosts(executionId: string): Promise<ExecutionCost[]>;
  getWorkflowCosts(workflowId: string, startDate?: Date, endDate?: Date): Promise<ExecutionCost[]>;
  getUserCosts(userId: string, startDate?: Date, endDate?: Date): Promise<ExecutionCost[]>;
  
  // Tags
  createTag(tag: InsertTag): Promise<Tag>;
  getAllTags(): Promise<Tag[]>;
  getTagById(id: string): Promise<Tag | undefined>;
  getTagByName(name: string): Promise<Tag | undefined>;
  deleteTag(id: string): Promise<void>;
  addWorkflowTag(workflowTag: InsertWorkflowTag): Promise<WorkflowTag>;
  removeWorkflowTag(workflowId: string, tagId: string): Promise<void>;
  getWorkflowTags(workflowId: string): Promise<Tag[]>;
  getWorkflowsByTag(tagId: string): Promise<Workflow[]>;
}

export class DatabaseStorage implements IStorage {
  // Users (Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Legacy user methods (for backward compatibility)
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Workflows
  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db.insert(workflows).values(workflow).returning();
    return newWorkflow;
  }

  async getWorkflowById(id: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }

  async getWorkflowsByUserId(userId: string): Promise<Workflow[]> {
    return await db
      .select()
      .from(workflows)
      .where(eq(workflows.userId, userId))
      .orderBy(desc(workflows.updatedAt));
  }

  async updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const [updated] = await db
      .update(workflows)
      .set({ ...workflow, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();
    return updated;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await db.delete(workflows).where(eq(workflows.id, id));
  }

  // Agents
  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [newAgent] = await db.insert(agents).values(agent).returning();
    return newAgent;
  }

  async getAgentById(id: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async getAgentsByWorkflowId(workflowId: string): Promise<Agent[]> {
    return await db.select().from(agents).where(eq(agents.workflowId, workflowId));
  }

  async updateAgent(id: string, agent: Partial<InsertAgent>): Promise<Agent | undefined> {
    const [updated] = await db
      .update(agents)
      .set(agent)
      .where(eq(agents.id, id))
      .returning();
    return updated;
  }

  async deleteAgent(id: string): Promise<void> {
    await db.delete(agents).where(eq(agents.id, id));
  }

  // Executions
  async createExecution(execution: InsertExecution): Promise<Execution> {
    const [newExecution] = await db.insert(executions).values(execution).returning();
    return newExecution;
  }

  async getExecutionById(id: string): Promise<Execution | undefined> {
    const [execution] = await db.select().from(executions).where(eq(executions.id, id));
    return execution;
  }

  async getExecutionsByWorkflowId(workflowId: string): Promise<Execution[]> {
    return await db
      .select()
      .from(executions)
      .where(eq(executions.workflowId, workflowId))
      .orderBy(desc(executions.startedAt));
  }

  async getExecutionsByUserId(userId: string): Promise<Execution[]> {
    return await db
      .select()
      .from(executions)
      .where(eq(executions.userId, userId))
      .orderBy(desc(executions.startedAt));
  }

  async updateExecution(id: string, execution: Partial<InsertExecution>): Promise<Execution | undefined> {
    const [updated] = await db
      .update(executions)
      .set(execution)
      .where(eq(executions.id, id))
      .returning();
    return updated;
  }

  async deleteExecution(id: string): Promise<void> {
    await db.delete(executions).where(eq(executions.id, id));
  }

  async deleteExecutionsByUserId(userId: string): Promise<number> {
    const result = await db.delete(executions).where(eq(executions.userId, userId)).returning({ id: executions.id });
    return result.length;
  }

  // Agent Messages
  async createAgentMessage(message: InsertAgentMessage): Promise<AgentMessage> {
    const [newMessage] = await db.insert(agentMessages).values(message).returning();
    return newMessage;
  }

  async getMessagesByExecutionId(executionId: string): Promise<AgentMessage[]> {
    return await db
      .select()
      .from(agentMessages)
      .where(eq(agentMessages.executionId, executionId))
      .orderBy(agentMessages.timestamp);
  }

  // Execution Logs
  async createExecutionLog(log: InsertExecutionLog): Promise<ExecutionLog> {
    const [newLog] = await db.insert(executionLogs).values(log).returning();
    return newLog;
  }

  async getLogsByExecutionId(executionId: string, filters?: {
    level?: string;
    agentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExecutionLog[]> {
    let query = db
      .select()
      .from(executionLogs)
      .where(eq(executionLogs.executionId, executionId))
      .orderBy(executionLogs.timestamp);
    
    if (filters?.level) {
      query = query.where(and(
        eq(executionLogs.executionId, executionId),
        eq(executionLogs.level, filters.level)
      )) as any;
    }
    
    if (filters?.agentId) {
      query = query.where(and(
        eq(executionLogs.executionId, executionId),
        eq(executionLogs.agentId, filters.agentId)
      )) as any;
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    return await query;
  }

  // Templates
  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  async getTemplateById(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async getAllTemplates(): Promise<Template[]> {
    return await db.select().from(templates).orderBy(desc(templates.usageCount));
  }

  async getFeaturedTemplates(): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .where(eq(templates.featured, true))
      .orderBy(desc(templates.usageCount));
  }

  async updateTemplate(id: string, template: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [updated] = await db
      .update(templates)
      .set(template)
      .where(eq(templates.id, id))
      .returning();
    return updated;
  }

  async deleteTemplate(id: string): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
  }

  async updateTemplateUsageCount(id: string): Promise<void> {
    await db
      .update(templates)
      .set({ usageCount: db.$count(templates.usageCount) })
      .where(eq(templates.id, id));
  }

  // Assistant Chats
  async createAssistantChat(chat: InsertAssistantChat): Promise<AssistantChat> {
    const [newChat] = await db.insert(assistantChats).values(chat).returning();
    return newChat;
  }

  async getAssistantChatById(id: string): Promise<AssistantChat | undefined> {
    const [chat] = await db.select().from(assistantChats).where(eq(assistantChats.id, id));
    return chat;
  }

  async getAssistantChatsByUserId(userId: string): Promise<AssistantChat[]> {
    return await db
      .select()
      .from(assistantChats)
      .where(eq(assistantChats.userId, userId))
      .orderBy(desc(assistantChats.updatedAt));
  }

  async updateAssistantChat(id: string, chat: Partial<InsertAssistantChat>): Promise<AssistantChat | undefined> {
    const [updated] = await db
      .update(assistantChats)
      .set({ ...chat, updatedAt: new Date() })
      .where(eq(assistantChats.id, id))
      .returning();
    return updated;
  }

  // Knowledge Base
  async createKnowledgeEntry(entry: InsertKnowledgeEntry): Promise<KnowledgeEntry> {
    const [newEntry] = await db.insert(knowledgeEntries).values(entry).returning();
    return newEntry;
  }

  async getKnowledgeByUserId(userId: string): Promise<KnowledgeEntry[]> {
    return await db
      .select()
      .from(knowledgeEntries)
      .where(eq(knowledgeEntries.userId, userId))
      .orderBy(desc(knowledgeEntries.createdAt));
  }

  async getKnowledgeByAgentType(userId: string, agentType: string): Promise<KnowledgeEntry[]> {
    return await db
      .select()
      .from(knowledgeEntries)
      .where(
        and(
          eq(knowledgeEntries.userId, userId),
          eq(knowledgeEntries.agentType, agentType)
        )
      )
      .orderBy(desc(knowledgeEntries.confidence), desc(knowledgeEntries.createdAt));
  }

  async getKnowledgeByCategory(userId: string, category: string): Promise<KnowledgeEntry[]> {
    return await db
      .select()
      .from(knowledgeEntries)
      .where(
        and(
          eq(knowledgeEntries.userId, userId),
          eq(knowledgeEntries.category, category)
        )
      )
      .orderBy(desc(knowledgeEntries.confidence), desc(knowledgeEntries.createdAt));
  }

  async getRelevantKnowledge(userId: string, agentType: string, categories: string[]): Promise<KnowledgeEntry[]> {
    // Get knowledge that matches either:
    // 1. The specific agent type (specialist knowledge)
    // 2. 'general' agent type (shared knowledge for all)
    // AND matches one of the requested categories
    const categoryConditions = categories.map(cat => eq(knowledgeEntries.category, cat));
    
    return await db
      .select()
      .from(knowledgeEntries)
      .where(
        and(
          eq(knowledgeEntries.userId, userId),
          or(
            eq(knowledgeEntries.agentType, agentType),
            eq(knowledgeEntries.agentType, 'general')
          ),
          or(...categoryConditions)
        )
      )
      .orderBy(desc(knowledgeEntries.confidence), desc(knowledgeEntries.createdAt))
      .limit(50); // Limit to top 50 most relevant knowledge entries
  }

  // Workflow Versions
  async createWorkflowVersion(version: InsertWorkflowVersion): Promise<WorkflowVersion> {
    const [newVersion] = await db.insert(workflowVersions).values(version).returning();
    return newVersion;
  }

  async getWorkflowVersions(workflowId: string): Promise<WorkflowVersion[]> {
    return await db
      .select()
      .from(workflowVersions)
      .where(eq(workflowVersions.workflowId, workflowId))
      .orderBy(desc(workflowVersions.version));
  }

  async getWorkflowVersionById(id: string): Promise<WorkflowVersion | undefined> {
    const [version] = await db.select().from(workflowVersions).where(eq(workflowVersions.id, id));
    return version;
  }

  async setActiveVersion(workflowId: string, versionId: string): Promise<void> {
    // First, deactivate all versions for this workflow
    await db
      .update(workflowVersions)
      .set({ isActive: false })
      .where(eq(workflowVersions.workflowId, workflowId));
    
    // Then activate the specified version
    await db
      .update(workflowVersions)
      .set({ isActive: true })
      .where(eq(workflowVersions.id, versionId));
  }

  // Workflow Schedules
  async createWorkflowSchedule(schedule: InsertWorkflowSchedule): Promise<WorkflowSchedule> {
    const [newSchedule] = await db.insert(workflowSchedules).values(schedule).returning();
    return newSchedule;
  }

  async getWorkflowSchedules(workflowId: string): Promise<WorkflowSchedule[]> {
    return await db
      .select()
      .from(workflowSchedules)
      .where(eq(workflowSchedules.workflowId, workflowId))
      .orderBy(desc(workflowSchedules.createdAt));
  }

  async getWorkflowScheduleById(id: string): Promise<WorkflowSchedule | undefined> {
    const [schedule] = await db.select().from(workflowSchedules).where(eq(workflowSchedules.id, id));
    return schedule;
  }

  async updateWorkflowSchedule(id: string, schedule: Partial<InsertWorkflowSchedule>): Promise<WorkflowSchedule | undefined> {
    const [updated] = await db
      .update(workflowSchedules)
      .set({ ...schedule, updatedAt: new Date() })
      .where(eq(workflowSchedules.id, id))
      .returning();
    return updated;
  }

  async deleteWorkflowSchedule(id: string): Promise<void> {
    await db.delete(workflowSchedules).where(eq(workflowSchedules.id, id));
  }

  async getAllEnabledSchedules(): Promise<WorkflowSchedule[]> {
    return await db
      .select()
      .from(workflowSchedules)
      .where(eq(workflowSchedules.enabled, true));
  }

  // Workflow Webhooks
  async createWorkflowWebhook(webhook: InsertWorkflowWebhook): Promise<WorkflowWebhook> {
    const [newWebhook] = await db.insert(workflowWebhooks).values(webhook).returning();
    return newWebhook;
  }

  async getWorkflowWebhooks(workflowId: string): Promise<WorkflowWebhook[]> {
    return await db
      .select()
      .from(workflowWebhooks)
      .where(eq(workflowWebhooks.workflowId, workflowId))
      .orderBy(desc(workflowWebhooks.createdAt));
  }

  async getWorkflowWebhookById(id: string): Promise<WorkflowWebhook | undefined> {
    const [webhook] = await db.select().from(workflowWebhooks).where(eq(workflowWebhooks.id, id));
    return webhook;
  }

  async getWorkflowWebhookByUrl(url: string): Promise<WorkflowWebhook | undefined> {
    const [webhook] = await db.select().from(workflowWebhooks).where(eq(workflowWebhooks.url, url));
    return webhook;
  }

  async updateWorkflowWebhook(id: string, webhook: Partial<InsertWorkflowWebhook>): Promise<WorkflowWebhook | undefined> {
    const [updated] = await db
      .update(workflowWebhooks)
      .set(webhook)
      .where(eq(workflowWebhooks.id, id))
      .returning();
    return updated;
  }

  async deleteWorkflowWebhook(id: string): Promise<void> {
    await db.delete(workflowWebhooks).where(eq(workflowWebhooks.id, id));
  }

  async createWebhookLog(log: InsertWebhookLog): Promise<WebhookLog> {
    const [newLog] = await db.insert(webhookLogs).values(log).returning();
    return newLog;
  }

  async getWebhookLogs(webhookId: string): Promise<WebhookLog[]> {
    return await db
      .select()
      .from(webhookLogs)
      .where(eq(webhookLogs.webhookId, webhookId))
      .orderBy(desc(webhookLogs.timestamp))
      .limit(100);
  }

  // Workflow Schemas
  async createWorkflowSchema(schema: InsertWorkflowSchema): Promise<WorkflowSchemaType> {
    const [newSchema] = await db.insert(workflowSchemas).values(schema).returning();
    return newSchema;
  }

  async getWorkflowSchema(workflowId: string): Promise<WorkflowSchemaType | undefined> {
    const [schema] = await db.select().from(workflowSchemas).where(eq(workflowSchemas.workflowId, workflowId));
    return schema;
  }

  async updateWorkflowSchema(workflowId: string, schema: Partial<InsertWorkflowSchema>): Promise<WorkflowSchemaType | undefined> {
    const [updated] = await db
      .update(workflowSchemas)
      .set({ ...schema, updatedAt: new Date() })
      .where(eq(workflowSchemas.workflowId, workflowId))
      .returning();
    return updated;
  }

  // Execution Costs
  async createExecutionCost(cost: InsertExecutionCost): Promise<ExecutionCost> {
    const [newCost] = await db.insert(executionCosts).values(cost).returning();
    return newCost;
  }

  async getExecutionCosts(executionId: string): Promise<ExecutionCost[]> {
    return await db
      .select()
      .from(executionCosts)
      .where(eq(executionCosts.executionId, executionId))
      .orderBy(desc(executionCosts.timestamp));
  }

  async getWorkflowCosts(workflowId: string, startDate?: Date, endDate?: Date): Promise<ExecutionCost[]> {
    const workflowExecutions = await db
      .select({ id: executions.id })
      .from(executions)
      .where(eq(executions.workflowId, workflowId));
    
    const executionIds = workflowExecutions.map(e => e.id);
    if (executionIds.length === 0) return [];
    
    return await db
      .select()
      .from(executionCosts)
      .where(inArray(executionCosts.executionId, executionIds))
      .orderBy(desc(executionCosts.timestamp));
  }

  async getUserCosts(userId: string, startDate?: Date, endDate?: Date): Promise<ExecutionCost[]> {
    const userExecutions = await db
      .select({ id: executions.id })
      .from(executions)
      .where(eq(executions.userId, userId));
    
    const executionIds = userExecutions.map(e => e.id);
    if (executionIds.length === 0) return [];
    
    return await db
      .select()
      .from(executionCosts)
      .where(inArray(executionCosts.executionId, executionIds))
      .orderBy(desc(executionCosts.timestamp));
  }

  // Tags
  async createTag(tag: InsertTag): Promise<Tag> {
    const [newTag] = await db.insert(tags).values(tag).returning();
    return newTag;
  }

  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(tags.name);
  }

  async getTagById(id: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag;
  }

  async getTagByName(name: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.name, name));
    return tag;
  }

  async deleteTag(id: string): Promise<void> {
    await db.delete(tags).where(eq(tags.id, id));
  }

  async addWorkflowTag(workflowTag: InsertWorkflowTag): Promise<WorkflowTag> {
    const [newWorkflowTag] = await db.insert(workflowTags).values(workflowTag).returning();
    return newWorkflowTag;
  }

  async removeWorkflowTag(workflowId: string, tagId: string): Promise<void> {
    await db.delete(workflowTags).where(
      and(
        eq(workflowTags.workflowId, workflowId),
        eq(workflowTags.tagId, tagId)
      )
    );
  }

  async getWorkflowTags(workflowId: string): Promise<Tag[]> {
    const workflowTagRecords = await db
      .select()
      .from(workflowTags)
      .where(eq(workflowTags.workflowId, workflowId));
    
    if (workflowTagRecords.length === 0) return [];
    
    const tagIds = workflowTagRecords.map(wt => wt.tagId);
    return await db
      .select()
      .from(tags)
      .where(inArray(tags.id, tagIds));
  }

  async getWorkflowsByTag(tagId: string): Promise<Workflow[]> {
    const workflowTagRecords = await db
      .select()
      .from(workflowTags)
      .where(eq(workflowTags.tagId, tagId));
    
    if (workflowTagRecords.length === 0) return [];
    
    const workflowIds = workflowTagRecords.map(wt => wt.workflowId);
    return await db
      .select()
      .from(workflows)
      .where(inArray(workflows.id, workflowIds));
  }
}

export const storage = new DatabaseStorage();
