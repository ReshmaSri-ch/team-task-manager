import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Briefcase, CheckCircle2, Clock, AlertTriangle, Play, Calendar, User as UserIcon } from 'lucide-react';

interface DashboardStats {
  projectsCount: number;
  totalTasksCount: number;
  assignedTasksCount: number;
  overdueTasksCount: number;
  statusBreakdown: { TODO: number; IN_PROGRESS: number; IN_REVIEW: number; COMPLETED: number };
  priorityBreakdown: { LOW: number; MEDIUM: number; HIGH: number; URGENT: number };
}

interface RecentActivityItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectName: string;
  projectId: string;
  assigneeName: string;
  creatorName: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string };
}

export const DashboardView: React.FC<{ onViewProject: (id: string) => void }> = ({ onViewProject }) => {
  const { user, setErrorMsg } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.dashboard.getStats();
        setStats(response.stats);
        setRecentActivity(response.recentActivity);
        setAssignedTasks(response.assignedTasks);
      } catch (err: any) {
        setErrorMsg('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [setErrorMsg]);

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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!stats) return <p>No telemetry data found.</p>;

  // Completion calculation
  const completed = stats.statusBreakdown.COMPLETED;
  const total = stats.totalTasksCount;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // SVG parameters for progress ring
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <>
      <div>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem', fontWeight: 800 }}>
          Welcome back, <span style={{ color: 'var(--accent-cyan)' }}>{user?.name}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Track tasks, collaborate with teams, and deliver projects faster with AetherTask.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="dashboard-grid">
        <div className="glass-panel stat-card primary">
          <div className="stat-value">{stats.projectsCount}</div>
          <div className="stat-label">Active Projects</div>
          <div className="stat-desc">Projects you're part of</div>
        </div>

        <div className="glass-panel stat-card cyan">
          <div className="stat-value">{stats.assignedTasksCount}</div>
          <div className="stat-label">My Open Tasks</div>
          <div className="stat-desc">Assigned to you</div>
        </div>

        <div className="glass-panel stat-card emerald">
          <div className="stat-value">{stats.statusBreakdown.COMPLETED}</div>
          <div className="stat-label">Tasks Completed</div>
          <div className="stat-desc">Across all projects</div>
        </div>

        <div className="glass-panel stat-card rose">
          <div className="stat-value">{stats.overdueTasksCount}</div>
          <div className="stat-label">Overdue Tasks</div>
          <div className="stat-desc">Needs immediate attention</div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="dashboard-sections">
        {/* Left Hand: Activities and My Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* My Tasks Panel */}
          <div className="glass-panel dashboard-panel">
            <h2 className="panel-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={20} color="var(--accent-cyan)" /> My Tasks ({assignedTasks.length})
            </h2>
            {assignedTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>You have no pending tasks right now. Great work! 🎉</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {assignedTasks.map(task => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                  return (
                    <div 
                      key={task.id} 
                      className="glass-panel" 
                      style={{ 
                        padding: '1rem 1.25rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: 'rgba(255,255,255,0.01)'
                      }}
                      onClick={() => onViewProject(task.project.id)}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{task.title}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-violet)' }}>Project: {task.project.name}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {task.dueDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: isOverdue ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                            <Clock size={14} />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Action Feed */}
          <div className="glass-panel dashboard-panel">
            <h2 className="panel-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="var(--accent-violet)" /> Recent Workspace Activity
            </h2>
            {recentActivity.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No activity logged in this workspace yet.</p>
            ) : (
              <div className="activity-feed">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-avatar">
                      {activity.creatorName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="activity-details">
                      <div className="activity-text">
                        <strong>{activity.creatorName}</strong> updated task <span style={{ color: 'var(--accent-cyan)', cursor: 'pointer' }} onClick={() => onViewProject(activity.projectId)}>"{activity.title}"</span> in <strong>{activity.projectName}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                        <span className="activity-time">{new Date(activity.updatedAt).toLocaleString()}</span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.05rem 0.4rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>{activity.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Hand: SVGs, Priority Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Progress Circle Panel */}
          <div className="glass-panel dashboard-panel">
            <h2 className="panel-title" style={{ fontSize: '1.15rem', marginBottom: '1rem', textAlign: 'center' }}>Overall Progress</h2>
            <div className="progress-ring-container">
              <svg width="150" height="150">
                <circle
                  stroke="rgba(255, 255, 255, 0.05)"
                  fill="transparent"
                  strokeWidth="8"
                  r={radius}
                  cx="75"
                  cy="75"
                />
                <circle
                  stroke="var(--accent-cyan)"
                  fill="transparent"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  r={radius}
                  cx="75"
                  cy="75"
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%',
                    transition: 'stroke-dashoffset 0.8s ease-in-out'
                  }}
                />
              </svg>
              <div className="ring-text-container">
                <div className="ring-percent">{completionRate}%</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tasks Finished</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.statusBreakdown.COMPLETED} of {stats.totalTasksCount} tasks</div>
              </div>
            </div>
          </div>

          {/* Priority Breakdown Panel */}
          <div className="glass-panel dashboard-panel">
            <h2 className="panel-title" style={{ fontSize: '1.15rem', marginBottom: '1.5rem' }}>Priority Distribution</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {(Object.keys(stats.priorityBreakdown) as Array<keyof typeof stats.priorityBreakdown>).map(priority => {
                const count = stats.priorityBreakdown[priority];
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                
                let color = 'var(--text-secondary)';
                if (priority === 'URGENT') color = 'var(--accent-rose)';
                if (priority === 'HIGH') color = 'var(--accent-amber)';
                if (priority === 'MEDIUM') color = 'var(--accent-cyan)';
                if (priority === 'LOW') color = 'var(--text-secondary)';

                return (
                  <div key={priority} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                      <span style={{ color }}>{priority}</span>
                      <span>{count} ({percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', background: color, borderRadius: '10px', transition: 'width 0.5s ease-out' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
