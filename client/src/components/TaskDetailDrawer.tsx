import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  X, MessageSquare, Send, Calendar, CheckSquare, 
  Trash2, Shield, AlertTriangle, User, RefreshCw
} from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
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
}

interface ProjectMember {
  id: string;
  role: 'PROJECT_ADMIN' | 'MEMBER';
  user: { id: string; name: string; email: string };
}

interface TaskDetailDrawerProps {
  task: Task;
  projectMembers: ProjectMember[];
  isProjectAdmin: boolean;
  onClose: () => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({ 
  task, 
  projectMembers, 
  isProjectAdmin, 
  onClose 
}) => {
  const { user, setErrorMsg, setSuccessMsg } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit Task Fields
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.substring(0, 10) : '');
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || '');
  const [updating, setUpdating] = useState(false);

  const fetchComments = async () => {
    try {
      const response = await api.tasks.getComments(task.id);
      setComments(response.comments);
    } catch (err: any) {
      console.error('Failed to load comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    setTitle(task.title);
    setDesc(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
    setAssigneeId(task.assigneeId || '');
    
    fetchComments();
  }, [task]);

  const handleUpdateTask = async () => {
    setUpdating(true);
    try {
      await api.tasks.update(task.id, {
        title,
        description: desc,
        status,
        priority,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null
      });
      setSuccessMsg('Duty specifications updated.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update task.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Delete this duty permanently?')) return;
    
    try {
      await api.tasks.delete(task.id);
      setSuccessMsg('Task deleted successfully.');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete task.');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await api.tasks.addComment(task.id, { content: newComment });
      setComments([...comments, response.comment]);
      setNewComment('');
    } catch (err: any) {
      setErrorMsg('Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const canDelete = isProjectAdmin || task.creatorId === user?.id || user?.role === 'ADMIN';

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-content">
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '90%' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>Task Identifier: {task.id.substring(0, 8)}</span>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleUpdateTask}
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid transparent',
                outline: 'none',
                padding: '0.2rem 0',
                width: '100%'
              }}
              onFocus={(e) => e.target.style.borderBottom = '1px solid var(--accent-violet)'}
              placeholder="Task Title"
            />
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Configurations Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select 
              className="input-control" 
              value={status} 
              onChange={(e: any) => {
                setStatus(e.target.value);
                // Trigger auto update on change
                setTimeout(handleUpdateTask, 100);
              }}
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Priority</label>
            <select 
              className="input-control" 
              value={priority} 
              onChange={(e: any) => {
                setPriority(e.target.value);
                setTimeout(handleUpdateTask, 100);
              }}
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Assignee</label>
            <select 
              className="input-control" 
              value={assigneeId} 
              onChange={(e) => {
                setAssigneeId(e.target.value);
                setTimeout(handleUpdateTask, 100);
              }}
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <option value="">-- Unassigned --</option>
              {projectMembers.map(m => (
                <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input 
              type="date" 
              className="input-control" 
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
              }}
              onBlur={handleUpdateTask}
              style={{ background: 'rgba(255,255,255,0.02)' }}
            />
          </div>
        </div>

        {/* Task Description */}
        <div className="form-group">
          <label className="form-label">Task Description</label>
          <textarea 
            className="input-control" 
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={handleUpdateTask}
            placeholder="Document details here..."
            style={{ minHeight: '120px', background: 'rgba(255,255,255,0.01)' }}
          />
        </div>

        {/* Comments Section */}
        <div className="comments-section">
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <MessageSquare size={18} color="var(--accent-cyan)" /> Discussion Thread ({comments.length})
          </h3>

          {/* Comment Form */}
          <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '0.75rem' }}>
            <input 
              type="text" 
              className="input-control" 
              placeholder="Contribute to discussion..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{ flex: 1 }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 1.25rem' }} disabled={submittingComment}>
              <Send size={16} />
            </button>
          </form>

          {/* Comments List */}
          {commentsLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading thread...</p>
          ) : comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>No comments recorded. Start the conversation!</p>
          ) : (
            <div className="comment-list">
              {comments.map(c => (
                <div key={c.id} className="comment-card">
                  <div className="comment-header">
                    <span className="comment-author">{c.user.name}</span>
                    <span className="comment-date">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="comment-body">{c.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', marginTop: 'auto' }}>
          <div>
            {updating && (
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <RefreshCw size={12} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} /> Auto-saving...
              </span>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>

          {canDelete && (
            <button 
              className="btn btn-danger btn-sm"
              onClick={handleDeleteTask}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Trash2 size={14} /> Delete Task
            </button>
          )}
        </div>
      </div>
    </>
  );
};
