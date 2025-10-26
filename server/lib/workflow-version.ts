import { db } from "../db";
import { workflowVersions, workflows, agents, type WorkflowVersion, type InsertWorkflowVersion } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

interface WorkflowData {
  nodes: any[];
  edges: any[];
  agents: any[];
  name: string;
  description: string | null;
}

export class WorkflowVersionManager {
  /**
   * Create a new version of a workflow
   */
  async createVersion(
    workflowId: string,
    userId: string,
    commitMessage?: string
  ): Promise<WorkflowVersion> {
    // Get current workflow data
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Get workflow agents
    const workflowAgents = await db.query.agents.findMany({
      where: eq(agents.workflowId, workflowId),
    });

    // Get latest version number
    const latestVersions = await db.query.workflowVersions.findMany({
      where: eq(workflowVersions.workflowId, workflowId),
      orderBy: [desc(workflowVersions.version)],
      limit: 1,
    });

    const latestVersion = latestVersions[0];
    const newVersionNumber = (latestVersion?.version || 0) + 1;

    // Prepare workflow data
    const workflowData: WorkflowData = {
      nodes: workflow.nodes as any[],
      edges: workflow.edges as any[],
      agents: workflowAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        description: agent.description,
        provider: agent.provider,
        model: agent.model,
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        capabilities: agent.capabilities,
        nodeId: agent.nodeId,
        position: agent.position,
      })),
      name: workflow.name,
      description: workflow.description,
    };

    // Create version
    const [version] = await db
      .insert(workflowVersions)
      .values({
        workflowId,
        version: newVersionNumber,
        commitMessage: commitMessage || `Version ${newVersionNumber}`,
        createdBy: userId,
        workflowData: workflowData as any,
        parentVersionId: latestVersion?.id || null,
      })
      .returning();

    return version;
  }

  /**
   * Get all versions for a workflow
   */
  async getVersions(workflowId: string): Promise<WorkflowVersion[]> {
    return await db.query.workflowVersions.findMany({
      where: eq(workflowVersions.workflowId, workflowId),
      orderBy: [desc(workflowVersions.version)],
    });
  }

  /**
   * Get a specific version
   */
  async getVersion(versionId: string): Promise<WorkflowVersion | undefined> {
    return await db.query.workflowVersions.findFirst({
      where: eq(workflowVersions.id, versionId),
    });
  }

  /**
   * Restore workflow to a specific version
   */
  async restoreVersion(workflowId: string, versionId: string, userId: string): Promise<void> {
    const version = await this.getVersion(versionId);
    if (!version) {
      throw new Error("Version not found");
    }

    if (version.workflowId !== workflowId) {
      throw new Error("Version does not belong to this workflow");
    }

    const workflowData = version.workflowData as WorkflowData;

    // Update workflow
    await db
      .update(workflows)
      .set({
        nodes: workflowData.nodes as any,
        edges: workflowData.edges as any,
        name: workflowData.name,
        description: workflowData.description,
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, workflowId));

    // Delete existing agents
    await db.delete(agents).where(eq(agents.workflowId, workflowId));

    // Recreate agents from version data
    if (workflowData.agents && workflowData.agents.length > 0) {
      for (const agentData of workflowData.agents) {
        await db.insert(agents).values({
          workflowId,
          name: agentData.name,
          role: agentData.role,
          description: agentData.description,
          provider: agentData.provider,
          model: agentData.model,
          systemPrompt: agentData.systemPrompt,
          temperature: agentData.temperature,
          maxTokens: agentData.maxTokens,
          capabilities: agentData.capabilities || [],
          nodeId: agentData.nodeId,
          position: agentData.position,
        });
      }
    }

    // Create a new version marking the restoration
    await this.createVersion(workflowId, userId, `Restored from version ${version.version}`);
  }

  /**
   * Compare two versions and return differences
   */
  async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<{
    version1: WorkflowVersion;
    version2: WorkflowVersion;
    diff: {
      nodesAdded: number;
      nodesRemoved: number;
      nodesModified: number;
      edgesAdded: number;
      edgesRemoved: number;
      agentsAdded: number;
      agentsRemoved: number;
      agentsModified: number;
    };
  }> {
    const version1 = await this.getVersion(versionId1);
    const version2 = await this.getVersion(versionId2);

    if (!version1 || !version2) {
      throw new Error("One or both versions not found");
    }

    const data1 = version1.workflowData as WorkflowData;
    const data2 = version2.workflowData as WorkflowData;

    // Calculate differences
    const nodes1Ids = new Set(data1.nodes.map((n: any) => n.id));
    const nodes2Ids = new Set(data2.nodes.map((n: any) => n.id));

    const nodesAdded = data2.nodes.filter((n: any) => !nodes1Ids.has(n.id)).length;
    const nodesRemoved = data1.nodes.filter((n: any) => !nodes2Ids.has(n.id)).length;
    const nodesModified = data2.nodes.filter((n: any) => {
      if (!nodes1Ids.has(n.id)) return false;
      const oldNode = data1.nodes.find((on: any) => on.id === n.id);
      return JSON.stringify(oldNode) !== JSON.stringify(n);
    }).length;

    const edges1Ids = new Set(data1.edges.map((e: any) => e.id));
    const edges2Ids = new Set(data2.edges.map((e: any) => e.id));

    const edgesAdded = data2.edges.filter((e: any) => !edges1Ids.has(e.id)).length;
    const edgesRemoved = data1.edges.filter((e: any) => !edges2Ids.has(e.id)).length;

    const agents1Ids = new Set(data1.agents.map((a: any) => a.id));
    const agents2Ids = new Set(data2.agents.map((a: any) => a.id));

    const agentsAdded = data2.agents.filter((a: any) => !agents1Ids.has(a.id)).length;
    const agentsRemoved = data1.agents.filter((a: any) => !agents2Ids.has(a.id)).length;
    const agentsModified = data2.agents.filter((a: any) => {
      if (!agents1Ids.has(a.id)) return false;
      const oldAgent = data1.agents.find((oa: any) => oa.id === a.id);
      return JSON.stringify(oldAgent) !== JSON.stringify(a);
    }).length;

    return {
      version1,
      version2,
      diff: {
        nodesAdded,
        nodesRemoved,
        nodesModified,
        edgesAdded,
        edgesRemoved,
        agentsAdded,
        agentsRemoved,
        agentsModified,
      },
    };
  }

  /**
   * Tag a version (e.g., "production", "v1.0", "stable")
   */
  async tagVersion(versionId: string, tag: string): Promise<void> {
    await db
      .update(workflowVersions)
      .set({ tag })
      .where(eq(workflowVersions.id, versionId));
  }

  /**
   * Update version statistics after execution
   */
  async updateVersionStats(
    workflowId: string,
    success: boolean,
    duration: number
  ): Promise<void> {
    const latestVersion = await db.query.workflowVersions.findFirst({
      where: eq(workflowVersions.workflowId, workflowId),
      orderBy: [desc(workflowVersions.version)],
    });

    if (!latestVersion) return;

    const newExecutionCount = (latestVersion.executionCount || 0) + 1;
    const currentSuccessRate = latestVersion.successRate || 0;
    const newSuccessRate = Math.round(
      ((currentSuccessRate * (newExecutionCount - 1)) + (success ? 100 : 0)) / newExecutionCount
    );
    
    const currentAvgDuration = latestVersion.avgDuration || 0;
    const newAvgDuration = Math.round(
      ((currentAvgDuration * (newExecutionCount - 1)) + duration) / newExecutionCount
    );

    await db
      .update(workflowVersions)
      .set({
        executionCount: newExecutionCount,
        successRate: newSuccessRate,
        avgDuration: newAvgDuration,
      })
      .where(eq(workflowVersions.id, latestVersion.id));
  }

  /**
   * Export a version as standalone workflow data
   */
  async exportVersion(versionId: string): Promise<WorkflowData> {
    const version = await this.getVersion(versionId);
    if (!version) {
      throw new Error("Version not found");
    }

    return version.workflowData as WorkflowData;
  }
}

export const versionManager = new WorkflowVersionManager();
