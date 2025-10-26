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
  knowledgeEntries 
} from "@shared/schema";
import { eq, desc, and, or } from "drizzle-orm";

export interface IStorage {
  // Users (Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
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
  getLogsByExecutionId(executionId: string): Promise<ExecutionLog[]>;
  
  // Templates
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplateById(id: string): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  getFeaturedTemplates(): Promise<Template[]>;
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

  async getLogsByExecutionId(executionId: string): Promise<ExecutionLog[]> {
    return await db
      .select()
      .from(executionLogs)
      .where(eq(executionLogs.executionId, executionId))
      .orderBy(executionLogs.timestamp);
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
}

export const storage = new DatabaseStorage();
