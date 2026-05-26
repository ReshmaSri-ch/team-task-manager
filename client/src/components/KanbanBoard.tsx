import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Users, Plus, UserPlus, Check, Trash2, Calendar, 
  Settings, Clock, Shield, Sparkles, MessageSquare
} from 'lucide-react';
import { TaskDetailDrawer } from './TaskDetailDrawer';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ProjectMember {
  id: string;
  role: 'PROJECT_ADMIN' | 'MEMBER';
  user: User;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  projectId: string;
  assigneeId: string | null;
  creatorId: string;
  createdAt: string;
  assignee?: User | null;
  creator?: { id: string; name: string };
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  members: ProjectMember[];
  tasks: Task[];
}

interface KanbanBoardProps {
  projectId: string;
  onBack: () => void;
}

const COLUMNS = [
  { id: 'TODO', title: 'To Do', accent: 'var(--accent-violet)' },
  { id: 'IN_PROGRESS', title: 'In Progress', accent: 'var(--accent-cyan)' },
  { id: 'IN_REVIEW', title: 'In Review', accent: 'var(--accent-amber)' },
  { id: 'COMPLETED', title: 'Completed', accent: 'var(--accent-emerald)' },
] as const;

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, onBack }) => {
  const { user, setErrorMsg, setSuccessMsg } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Modals
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form Fields: Add Member
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'PROJECT_ADMIN' | 'MEMBER'>('MEMBER');
  const [memberSubmitting, setMemberSubmitting] = useState(false);

  // Form Fields: Create Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [taskStatus, setTaskStatus] = useState<Task['status']>('TODO');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      const response = await api.projects.get(projectId);
      setProject(response.project);
    } catch (err: any) {
      setErrorMsg('Failed to open project board.');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  // Check roles
  const currentUserRole = project?.members.find(m => m.user.id === user?.id)?.role;
  const isProjectAdmin = currentUserRole === 'PROJECT_ADMIN' || user?.role === 'ADMIN';

  // --- Drag and Drop Mechanics ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: Task['status']) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId || !project) return;

    // Find task
    const targetTask = project.tasks.find(t => t.id === taskId);
    if (!targetTask || targetTask.status === columnId) return;

    // Optimistic Update
    const previousTasks = [...project.tasks];
    const updatedTasks = project.tasks.map(t => 
      t.id === taskId ? { ...t, status: columnId } : t
    );
    setProject({ ...project, tasks: updatedTasks });

    try {
      await api.tasks.update(taskId, { status: columnId });
      setSuccessMsg('Task updated.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update task state.');
      // Rollback
      setProject({ ...project, tasks: previousTasks });
    }
  };

  // --- Form Handlers ---
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !project) return;

    setMemberSubmitting(true);
    try {
      await api.projects.addMember(projectId, { email: inviteEmail, role: inviteRole });
      setSuccessMsg('Member added successfully.');
      setInviteEmail('');
      setShowMemberModal(false);
      fetchProjectDetails();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add project member.');
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!project) return;
    if (!window.confirm('Are you sure you want to remove this member from the project?')) return;

    try {
      await api.projects.removeMember(projectId, userId);
      setSuccessMsg('Member removed.');
      fetchProjectDetails();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove member.');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !project) return;

    setTaskSubmitting(true);
    try {
      await api.tasks.create(projectId, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        status: taskStatus,
        dueDate: taskDueDate || null,
        assigneeId: taskAssignee || null
      });

      setSuccessMsg('Task created!');
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setTaskAssignee('');
      setShowTaskModal(false);
      fetchProjectDetails();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create task.');
    } finally {
      setTaskSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(140, 82, 255, 0.15)',
          borderTopColor: 'var(--accent-violet)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (!project) return <p>Project not found.</p>;

  return (
    <>
      {/* Workspace Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onBack}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem' }}
          >
            <ArrowLeft size={16} />
          </button>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{project.name}</h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'rgba(0, 229, 255, 0.08)', border: '1px solid rgba(0, 229, 255, 0.2)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                {currentUserRole === 'PROJECT_ADMIN' ? 'Board Administrator' : 'Member'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {project.description || 'No board overview details logged.'}
            </p>
          </div>
        </div>

        {/* Board Controls Header */}
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'rgba(12, 10, 24, 0.45)' }}>
          {/* Members list */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Users size={16} />
              <span style={{ fontWeight: 600 }}>Teammates:</span>
            </div>
            
            <div className="project-members-stack">
              {project.members.map(m => (
                <div 
                  key={m.id} 
                  className="member-stack-avatar"
                  title={`${m.user.name} (${m.role === 'PROJECT_ADMIN' ? 'Board Admin' : 'Member'})`}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  {m.user.name.substring(0, 2).toUpperCase()}
                  {m.role === 'PROJECT_ADMIN' && (
                    <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-violet)', border: '1px solid var(--text-primary)' }} />
                  )}
                </div>
              ))}
            </div>

            {isProjectAdmin && (
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ height: '32px', borderRadius: 'var(--radius-full)', padding: '0 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setShowMemberModal(true)}
              >
                <UserPlus size={14} /> Invite
              </button>
            )}
          </div>

          {/* Quick task action */}
          <button className="btn btn-primary btn-sm" onClick={() => {
            setTaskStatus('TODO');
            setShowTaskModal(true);
          }}>
            <Plus size={16} /> Create Task
          </button>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colTasks = project.tasks.filter(t => t.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div 
              key={col.id} 
              className={`kanban-column`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{
                borderColor: isOver ? col.accent : 'rgba(255, 255, 255, 0.05)',
                background: isOver ? 'rgba(140, 82, 255, 0.03)' : 'rgba(12, 10, 24, 0.35)'
              }}
            >
              {/* Column Header */}
              <div className="kanban-column-header">
                <div className="column-title-container">
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.accent }} />
                  <span className="column-title">{col.title}</span>
                </div>
                <span className="column-count">{colTasks.length}</span>
              </div>

              {/* Task Cards Container */}
              <div className="task-list">
                {colTasks.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', border: '1px dashed rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No duties here
                  </div>
                ) : (
                  colTasks.map(task => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
                    
                    return (
                      <div 
                        key={task.id}
                        className="glass-panel task-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setSelectedTask(task)}
                      >
                        {/* Task Card Header */}
                        <div className="task-header">
                          <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Task Title */}
                        <div className="task-card-title">{task.title}</div>

                        {/* Task Card Footer */}
                        <div className="task-footer">
                          {task.dueDate ? (
                            <span className={`task-due-date ${isOverdue ? 'overdue' : ''}`}>
                              <Calendar size={12} />
                              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </span>
                          ) : (
                            <span className="task-due-date">
                              <Calendar size={12} />
                              <span>No date</span>
                            </span>
                          )}

                          {task.assignee ? (
                            <div 
                              className="member-stack-avatar" 
                              style={{ width: '24px', height: '24px', fontSize: '0.65rem', margin: 0 }}
                              title={`Assigned to ${task.assignee.name}`}
                            >
                              {task.assignee.name.substring(0, 2).toUpperCase()}
                            </div>
                          ) : (
                            <div 
                              className="member-stack-avatar" 
                              style={{ width: '24px', height: '24px', fontSize: '0.65rem', margin: 0, background: 'none', border: '1px dashed rgba(255,255,255,0.15)', color: 'var(--text-muted)' }}
                              title="Unassigned"
                            >
                              ?
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="var(--accent-cyan)" /> Create Project Duty
            </div>
            
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="e.g. Design authentication state model"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Task Description</label>
                <textarea 
                  className="input-control" 
                  placeholder="Provide precise details, criteria, and documentation paths..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select 
                    className="input-control"
                    value={taskPriority}
                    onChange={(e: any) => setTaskPriority(e.target.value)}
                    style={{ background: 'var(--bg-panel-solid)' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select 
                    className="input-control"
                    value={taskStatus}
                    onChange={(e: any) => setTaskStatus(e.target.value)}
                    style={{ background: 'var(--bg-panel-solid)' }}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input 
                    type="date" 
                    className="input-control" 
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    style={{ background: 'var(--bg-panel-solid)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select 
                    className="input-control"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    style={{ background: 'var(--bg-panel-solid)' }}
                  >
                    <option value="">-- Unassigned --</option>
                    {project.members.map(m => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name} ({m.user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowTaskModal(false)}
                  disabled={taskSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={taskSubmitting}
                >
                  {taskSubmitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Management Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--accent-violet)" /> Teammate Registry
            </div>

            {/* Invite Form */}
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">Member Email *</label>
                <input 
                  type="email" 
                  className="input-control" 
                  placeholder="name@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">Role in Board</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="radio" 
                      name="inviteRole" 
                      value="MEMBER"
                      checked={inviteRole === 'MEMBER'}
                      onChange={() => setInviteRole('MEMBER')}
                    /> Member
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="radio" 
                      name="inviteRole" 
                      value="PROJECT_ADMIN"
                      checked={inviteRole === 'PROJECT_ADMIN'}
                      onChange={() => setInviteRole('PROJECT_ADMIN')}
                    /> Project Admin
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-sm"
                disabled={memberSubmitting}
                style={{ alignSelf: 'flex-end' }}
              >
                {memberSubmitting ? 'Adding...' : 'Add Teammate'}
              </button>
            </form>

            {/* Existing Members Listing */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Current Members:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                {project.members.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {m.user.name} 
                        {m.role === 'PROJECT_ADMIN' && <span title="Board Admin"><Shield size={12} color="var(--accent-violet)" /></span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.user.email}</div>
                    </div>

                    {isProjectAdmin && m.user.id !== user?.id && (
                      <button 
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        onClick={() => handleRemoveMember(m.user.id)}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-buttons">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Drawer */}
      {selectedTask && (
        <TaskDetailDrawer 
          task={selectedTask}
          projectMembers={project.members}
          isProjectAdmin={isProjectAdmin}
          onClose={() => {
            setSelectedTask(null);
            fetchProjectDetails(); // Reload changes made in drawer
          }}
        />
      )}
    </>
  );
};
