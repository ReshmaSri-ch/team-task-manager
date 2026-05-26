import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const userId = req.user.id;
    const isSystemAdmin = req.user.role === 'ADMIN';

    // 1. Get relevant project IDs
    let projectIds: string[] = [];
    if (isSystemAdmin) {
      const allProjects = await prisma.project.findMany({ select: { id: true } });
      projectIds = allProjects.map((p) => p.id);
    } else {
      const userMemberships = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });
      projectIds = userMemberships.map((m) => m.projectId);
    }

    // If user has no projects, return empty stats immediately
    if (projectIds.length === 0) {
      return res.status(200).json({
        stats: {
          projectsCount: 0,
          totalTasksCount: 0,
          assignedTasksCount: 0,
          overdueTasksCount: 0,
          statusBreakdown: { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, COMPLETED: 0 },
          priorityBreakdown: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 },
        },
        recentActivity: [],
        assignedTasks: [],
      });
    }

    // 2. Query numbers
    const projectsCount = projectIds.length;

    // Total Tasks in user's projects
    const totalTasksCount = await prisma.task.count({
      where: { projectId: { in: projectIds } },
    });

    // Tasks assigned to user specifically
    const assignedTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: 'COMPLETED' },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
    const assignedTasksCount = assignedTasks.length;

    // Overdue tasks count (dueDate < now, status !== COMPLETED)
    const now = new Date();
    const overdueTasksCount = await prisma.task.count({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: now },
        status: { not: 'COMPLETED' },
      },
    });

    // Status breakdown
    const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'] as const;
    const statusBreakdown = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, COMPLETED: 0 };
    for (const status of statuses) {
      statusBreakdown[status] = await prisma.task.count({
        where: { projectId: { in: projectIds }, status },
      });
    }

    // Priority breakdown
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
    const priorityBreakdown = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    for (const priority of priorities) {
      priorityBreakdown[priority] = await prisma.task.count({
        where: { projectId: { in: projectIds }, priority },
      });
    }

    // 3. Recent Activity (latest tasks created/updated or commented)
    const recentActivity = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
        creator: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    });

    res.status(200).json({
      stats: {
        projectsCount,
        totalTasksCount,
        assignedTasksCount,
        overdueTasksCount,
        statusBreakdown,
        priorityBreakdown,
      },
      recentActivity: recentActivity.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        projectName: task.project.name,
        projectId: task.projectId,
        assigneeName: task.assignee?.name || 'Unassigned',
        creatorName: task.creator.name,
        updatedAt: task.updatedAt,
      })),
      assignedTasks,
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to aggregate dashboard metrics.' });
  }
};
