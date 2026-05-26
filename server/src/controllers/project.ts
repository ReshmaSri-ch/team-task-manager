import { Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Create Project and add creator as PROJECT_ADMIN in a transaction
    const project = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: {
          name,
          description,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: proj.id,
          userId: req.user!.id,
          role: 'PROJECT_ADMIN',
        },
      });

      return proj;
    });

    res.status(201).json({
      message: 'Project created successfully.',
      project,
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project.' });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    let projects;

    if (req.user.role === 'ADMIN') {
      // System admin can see all projects
      projects = await prisma.project.findMany({
        include: {
          _count: {
            select: { members: true, tasks: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Members only see projects they belong to
      projects = await prisma.project.findMany({
        where: {
          members: {
            some: {
              userId: req.user.id,
            },
          },
        },
        include: {
          _count: {
            select: { members: true, tasks: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.status(200).json({ projects });
  } catch (error: any) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Verify membership (unless system Admin)
    if (req.user.role !== 'ADMIN') {
      const isMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: req.user.id,
            projectId: id,
          },
        },
      });

      if (!isMember) {
        return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
      }
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
            creator: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.status(200).json({ project });
  } catch (error: any) {
    console.error('Get project details error:', error);
    res.status(500).json({ error: 'Failed to fetch project details.' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    const project = await prisma.project.update({
      where: { id },
      data: { name, description },
    });

    res.status(200).json({
      message: 'Project updated successfully.',
      project,
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project.' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Project deleted successfully.',
    });
  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
};

export const addProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { email, role } = req.body; // role: PROJECT_ADMIN or MEMBER

    if (!email) {
      return res.status(400).json({ error: 'User email is required.' });
    }

    // Find User
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ error: 'User with this email does not exist.' });
    }

    // Check if already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this project.' });
    }

    // Add Member
    const projectMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId: user.id,
        role: role === 'PROJECT_ADMIN' ? 'PROJECT_ADMIN' : 'MEMBER',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.status(201).json({
      message: 'Member added to project successfully.',
      member: projectMember,
    });
  } catch (error: any) {
    console.error('Add project member error:', error);
    res.status(500).json({ error: 'Failed to add project member.' });
  }
};

export const removeProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id: projectId, userId } = req.params;

    // Check if the user is the only PROJECT_ADMIN
    const projectAdmins = await prisma.projectMember.findMany({
      where: {
        projectId,
        role: 'PROJECT_ADMIN',
      },
    });

    const targetMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found in this project.' });
    }

    if (targetMember.role === 'PROJECT_ADMIN' && projectAdmins.length <= 1) {
      return res.status(400).json({
        error: 'Cannot remove the only Project Administrator. Appoint another Administrator first.',
      });
    }

    // Remove member
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    res.status(200).json({
      message: 'Member removed from project successfully.',
    });
  } catch (error: any) {
    console.error('Remove project member error:', error);
    res.status(500).json({ error: 'Failed to remove project member.' });
  }
};
