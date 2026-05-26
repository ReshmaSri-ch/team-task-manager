import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { signup, login, me } from './controllers/auth';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from './controllers/project';
import {
  createTask,
  updateTask,
  deleteTask,
  createComment,
  getComments,
} from './controllers/task';
import { getDashboardStats } from './controllers/dashboard';
import {
  authenticateJWT,
  requireProjectAdmin,
  requireProjectMember,
} from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(
  cors({
    origin: '*', // Easily configurable for security
    credentials: true,
  })
);

app.use(express.json());

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// --- Authentication ---
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.get('/api/auth/me', authenticateJWT, me);

// --- Projects ---
app.post('/api/projects', authenticateJWT, createProject);
app.get('/api/projects', authenticateJWT, getProjects);
app.get('/api/projects/:id', authenticateJWT, getProjectById);
app.put('/api/projects/:id', authenticateJWT, requireProjectAdmin, updateProject);
app.delete('/api/projects/:id', authenticateJWT, requireProjectAdmin, deleteProject);

// --- Project Members ---
app.post('/api/projects/:id/members', authenticateJWT, requireProjectAdmin, addProjectMember);
app.delete('/api/projects/:id/members/:userId', authenticateJWT, requireProjectAdmin, removeProjectMember);

// --- Tasks ---
app.post('/api/projects/:projectId/tasks', authenticateJWT, requireProjectMember, createTask);
app.put('/api/tasks/:id', authenticateJWT, updateTask);
app.delete('/api/tasks/:id', authenticateJWT, deleteTask);

// --- Comments ---
app.post('/api/tasks/:taskId/comments', authenticateJWT, createComment);
app.get('/api/tasks/:taskId/comments', authenticateJWT, getComments);

// --- Dashboard & Analytics ---
app.get('/api/dashboard/stats', authenticateJWT, getDashboardStats);

// --- Serve Static Frontend in Production ---
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// Fallback for Single Page Application (SPA) routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// --- Global Error Handler ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Team Task Manager Server is running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
