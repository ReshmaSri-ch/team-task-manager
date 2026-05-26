import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, status, dueDate, assigneeId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Verify assignee is a member of the project (if provided)
    if (assigneeId) {
      const isAssigneeMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: assigneeId,
            projectId,
          },
        },
      });

      if (!isAssigneeMember) {
        return res.status(400).json({ error: 'Assignee must be a member of the project.' });
      }
    }

    // Create Task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: req.user.id,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json({
      message: 'Task created successfully.',
      task,
    });
  } catch (error: any) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task.' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, dueDate, assigneeId } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Find the task
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Verify requester is a project member
    if (req.user.role !== 'ADMIN') {
      const isMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: req.user.id,
            projectId: task.projectId,
          },
        },
      });

      if (!isMember) {
        return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
      }
    }

    // Verify assignee is a member of the project (if assignee is changing)
    if (assigneeId && assigneeId !== task.assigneeId) {
      const isAssigneeMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: assigneeId,
            projectId: task.projectId,
          },
        },
      });

      if (!isAssigneeMember) {
        return res.status(400).json({ error: 'Assignee must be a member of the project.' });
      }
    }

    // Update Task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : task.title,
        description: description !== undefined ? description : task.description,
        priority: priority !== undefined ? priority : task.priority,
        status: status !== undefined ? status : task.status,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
        assigneeId: assigneeId !== undefined ? (assigneeId || null) : task.assigneeId,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(200).json({
      message: 'Task updated successfully.',
      task: updatedTask,
    });
  } catch (error: any) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task.' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Find the task
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Verify deletion permissions: System Admin, Project Admin, or task Creator
    let canDelete = false;

    if (req.user.role === 'ADMIN') {
      canDelete = true;
    } else if (task.creatorId === req.user.id) {
      canDelete = true;
    } else {
      // Check if user is a Project Admin
      const projectMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: req.user.id,
            projectId: task.projectId,
          },
        },
      });

      if (projectMember && projectMember.role === 'PROJECT_ADMIN') {
        canDelete = true;
      }
    }

    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to delete this task.' });
    }

    await prisma.task.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Task deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
};

// --- Comment Handlers ---

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required.' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Find the task and verify access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    if (req.user.role !== 'ADMIN') {
      const isMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: req.user.id,
            projectId: task.projectId,
          },
        },
      });

      if (!isMember) {
        return res.status(403).json({ error: 'Access denied. You must be a project member to add comments.' });
      }
    }

    // Create Comment
    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: req.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({
      message: 'Comment added successfully.',
      comment,
    });
  } catch (error: any) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
};

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Find the task and verify access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    if (req.user.role !== 'ADMIN') {
      const isMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: req.user.id,
            projectId: task.projectId,
          },
        },
      });

      if (!isMember) {
        return res.status(403).json({ error: 'Access denied. You must be a project member to read comments.' });
      }
    }

    // Fetch comments
    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ comments });
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
};
