import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Folder, Users, CheckSquare, Plus, Trash2, ArrowRight } from 'lucide-react';

interface ProjectMember {
  id: string;
  role: 'PROJECT_ADMIN' | 'MEMBER';
  user: { id: string; name: string; email: string };
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { members: number; tasks: number };
  members: ProjectMember[];
}

interface ProjectViewProps {
  onSelectProject: (id: string) => void;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ onSelectProject }) => {
  const { user, setErrorMsg, setSuccessMsg } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New Project Fields
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      const response = await api.projects.list();
      setProjects(response.projects);
    } catch (err: any) {
      setErrorMsg('Failed to load project directories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSubmitting(true);
    try {
      await api.projects.create({ name: newName, description: newDesc });
      setNewName('');
      setNewDesc('');
      setShowCreateModal(false);
      setSuccessMsg('Project created successfully!');
      fetchProjects();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation click
    if (!window.confirm('Are you absolutely sure you want to delete this project? This will permanently delete all tasks, comments, and members.')) {
      return;
    }

    try {
      await api.projects.delete(id);
      setSuccessMsg('Project deleted successfully!');
      fetchProjects();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete project.');
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

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem', fontWeight: 800 }}>Project Directories</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your workspace boards, members, and workflows.</p>
        </div>
        
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} /> Create Project
        </button>
      </div>

      {/* Projects Card Grid */}
      {projects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Folder size={48} color="var(--text-muted)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>No active projects found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Create a project directory to get started with task planning.</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map(proj => {
            // Check if current user is an Admin of this project
            const userMember = proj.members.find(m => m.user.id === user?.id);
            const isProjectAdmin = userMember?.role === 'PROJECT_ADMIN' || user?.role === 'ADMIN';

            return (
              <div 
                key={proj.id} 
                className="glass-panel project-card"
                onClick={() => onSelectProject(proj.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="project-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div className="project-name">{proj.name}</div>
                    {isProjectAdmin && (
                      <button 
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                        onClick={(e) => handleDeleteProject(proj.id, e)}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        title="Delete project"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="project-desc">{proj.description || 'No directory synopsis provided.'}</div>
                </div>

                <div className="project-meta">
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Users size={14} />
                      <span>{proj._count.members} Members</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckSquare size={14} />
                      <span>{proj._count.tasks} Tasks</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="project-members-stack">
                      {proj.members.slice(0, 4).map(m => (
                        <div 
                          key={m.id} 
                          className="member-stack-avatar" 
                          title={`${m.user.name} (${m.role})`}
                        >
                          {m.user.name.substring(0, 2).toUpperCase()}
                        </div>
                      ))}
                      {proj._count.members > 4 && (
                        <div className="member-stack-avatar" style={{ fontSize: '0.65rem' }}>
                          +{proj._count.members - 4}
                        </div>
                      )}
                    </div>
                    <ArrowRight size={16} color="var(--accent-cyan)" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Glassmorphic Project Creation Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Initialize Project Board</div>
            
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="e.g. Apollo Landing Module"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Description</label>
                <textarea 
                  className="input-control" 
                  placeholder="Summarize the core objectives and timeline..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Initializing...' : 'Initialize Directory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
