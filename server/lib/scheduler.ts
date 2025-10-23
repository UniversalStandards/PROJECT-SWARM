import cron, { type ScheduledTask } from "node-cron";
import { db } from "../db";
import { workflowSchedules, executions, workflows, type WorkflowSchedule, type InsertWorkflowSchedule } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { orchestrator } from "../ai/orchestrator";

interface ScheduleJob {
  scheduleId: string;
  cronTask: ScheduledTask;
}

export class WorkflowScheduler {
  private jobs: Map<string, ScheduleJob> = new Map();
  private initialized = false;

  /**
   * Initialize scheduler and load all active schedules
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("[Scheduler] Initializing workflow scheduler...");

    const schedules = await db.query.workflowSchedules.findMany({
      where: eq(workflowSchedules.enabled, true),
    });

    for (const schedule of schedules) {
      try {
        await this.scheduleWorkflow(schedule);
        console.log(`[Scheduler] Scheduled workflow ${schedule.workflowId} with cron: ${schedule.cronExpression}`);
      } catch (error) {
        console.error(`[Scheduler] Error scheduling workflow ${schedule.workflowId}:`, error);
      }
    }

    this.initialized = true;
    console.log(`[Scheduler] Initialized with ${this.jobs.size} active schedules`);
  }

  /**
   * Create a new schedule
   */
  async createSchedule(data: InsertWorkflowSchedule): Promise<WorkflowSchedule> {
    // Validate cron expression
    if (!cron.validate(data.cronExpression)) {
      throw new Error("Invalid cron expression");
    }

    // Calculate next run time
    const nextRunAt = this.getNextRunTime(data.cronExpression, data.timezone || "UTC");

    const [schedule] = await db
      .insert(workflowSchedules)
      .values({
        ...data,
        nextRunAt,
      })
      .returning();

    // Schedule the job if enabled
    if (schedule.enabled) {
      await this.scheduleWorkflow(schedule);
    }

    return schedule;
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: Partial<InsertWorkflowSchedule>
  ): Promise<WorkflowSchedule> {
    // If cron expression is being updated, validate it
    if (updates.cronExpression && !cron.validate(updates.cronExpression)) {
      throw new Error("Invalid cron expression");
    }

    // Calculate new next run time if cron or timezone changed
    let nextRunAt: Date | undefined;
    if (updates.cronExpression || updates.timezone) {
      const schedule = await db.query.workflowSchedules.findFirst({
        where: eq(workflowSchedules.id, scheduleId),
      });
      if (schedule) {
        nextRunAt = this.getNextRunTime(
          updates.cronExpression || schedule.cronExpression,
          updates.timezone || schedule.timezone
        );
      }
    }

    const [updated] = await db
      .update(workflowSchedules)
      .set({
        ...updates,
        ...(nextRunAt && { nextRunAt }),
        updatedAt: new Date(),
      })
      .where(eq(workflowSchedules.id, scheduleId))
      .returning();

    // Reschedule the job
    this.unscheduleWorkflow(scheduleId);
    if (updated.enabled) {
      await this.scheduleWorkflow(updated);
    }

    return updated;
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    this.unscheduleWorkflow(scheduleId);
    await db.delete(workflowSchedules).where(eq(workflowSchedules.id, scheduleId));
  }

  /**
   * Get all schedules for a workflow
   */
  async getSchedules(workflowId: string): Promise<WorkflowSchedule[]> {
    return await db.query.workflowSchedules.findMany({
      where: eq(workflowSchedules.workflowId, workflowId),
    });
  }

  /**
   * Schedule a workflow execution
   */
  private async scheduleWorkflow(schedule: WorkflowSchedule): Promise<void> {
    const task = cron.schedule(
      schedule.cronExpression,
      async () => {
        console.log(`[Scheduler] Executing scheduled workflow ${schedule.workflowId}`);
        await this.executeScheduledWorkflow(schedule);
      }
    );

    this.jobs.set(schedule.id, {
      scheduleId: schedule.id,
      cronTask: task,
    });
  }

  /**
   * Unschedule a workflow
   */
  private unscheduleWorkflow(scheduleId: string): void {
    const job = this.jobs.get(scheduleId);
    if (job) {
      job.cronTask.stop();
      this.jobs.delete(scheduleId);
      console.log(`[Scheduler] Unscheduled workflow schedule ${scheduleId}`);
    }
  }

  /**
   * Execute a scheduled workflow
   */
  private async executeScheduledWorkflow(schedule: WorkflowSchedule): Promise<void> {
    try {
      // Get workflow
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, schedule.workflowId),
      });

      if (!workflow) {
        console.error(`[Scheduler] Workflow ${schedule.workflowId} not found`);
        return;
      }

      // Create execution record
      const [execution] = await db
        .insert(executions)
        .values({
          workflowId: schedule.workflowId,
          userId: workflow.userId,
          status: "pending",
          input: { scheduled: true, scheduleId: schedule.id },
        })
        .returning();

      // Execute workflow
      try {
        await orchestrator.executeWorkflow(execution.id);

        // Update schedule statistics
        await db
          .update(workflowSchedules)
          .set({
            lastRunAt: new Date(),
            nextRunAt: this.getNextRunTime(schedule.cronExpression, schedule.timezone),
            executionCount: (schedule.executionCount || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(workflowSchedules.id, schedule.id));

        console.log(`[Scheduler] Successfully executed workflow ${schedule.workflowId}`);
      } catch (error) {
        console.error(`[Scheduler] Error executing workflow ${schedule.workflowId}:`, error);
        
        // Update execution with error
        await db
          .update(executions)
          .set({
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
            completedAt: new Date(),
          })
          .where(eq(executions.id, execution.id));
      }
    } catch (error) {
      console.error(`[Scheduler] Error in scheduled workflow execution:`, error);
    }
  }

  /**
   * Calculate next run time for a cron expression
   */
  private getNextRunTime(cronExpression: string, timezone: string): Date {
    // Parse cron expression and calculate next execution time
    // This is a simplified version - in production, use a proper cron parser
    const now = new Date();
    
    // For now, just add a reasonable interval based on common patterns
    // In a real implementation, parse the cron expression properly
    const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour default
    
    return nextRun;
  }

  /**
   * Get next N run times for a cron expression (for UI preview)
   */
  getNextRunTimes(cronExpression: string, timezone: string, count: number = 5): Date[] {
    if (!cron.validate(cronExpression)) {
      throw new Error("Invalid cron expression");
    }

    const runTimes: Date[] = [];
    const now = new Date();
    
    // This is a simplified implementation
    // In production, use a proper cron parser like cron-parser package
    for (let i = 0; i < count; i++) {
      runTimes.push(new Date(now.getTime() + (i + 1) * 60 * 60 * 1000));
    }

    return runTimes;
  }

  /**
   * Pause a schedule
   */
  async pauseSchedule(scheduleId: string): Promise<void> {
    await this.updateSchedule(scheduleId, { enabled: false });
  }

  /**
   * Resume a schedule
   */
  async resumeSchedule(scheduleId: string): Promise<void> {
    await this.updateSchedule(scheduleId, { enabled: true });
  }

  /**
   * Shutdown scheduler and stop all jobs
   */
  shutdown(): void {
    console.log("[Scheduler] Shutting down scheduler...");
    for (const [scheduleId, job] of this.jobs.entries()) {
      job.cronTask.stop();
    }
    this.jobs.clear();
    this.initialized = false;
    console.log("[Scheduler] Scheduler shut down");
  }
}

export const scheduler = new WorkflowScheduler();
