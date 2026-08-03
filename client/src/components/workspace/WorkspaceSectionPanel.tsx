import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspaceApi';
import { SectionFormPanel } from './SectionFormPanel';
import { BudgetBuilder } from './BudgetBuilder';
import { AttachmentManager } from './AttachmentManager';
import type { WorkspaceSection, WorkspaceTask, WorkspaceComment } from '../../types/workspace';

interface WorkspaceSectionPanelProps {
  section: WorkspaceSection;
  workspaceId: string;
  onFieldBlur?: () => void;
  isLocked?: boolean;
}

export function WorkspaceSectionPanel({ section, workspaceId, onFieldBlur, isLocked = false }: WorkspaceSectionPanelProps) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const tasksQuery = useQuery({
    queryKey: ['section-tasks', workspaceId],
    queryFn: () => workspaceApi.getTasks(workspaceId),
  });

  const commentsQuery = useQuery({
    queryKey: ['comments', workspaceId],
    queryFn: () => workspaceApi.getComments(workspaceId),
  });

  const postCommentMutation = useMutation({
    mutationFn: (text: string) =>
      workspaceApi.postComment(workspaceId, {
        comment_text: text,
        section_id: section.section_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', workspaceId] });
      setCommentText('');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: 'open' | 'complete' }) =>
      workspaceApi.updateTask(workspaceId, taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section-tasks', workspaceId] });
    },
  });

  const sectionTasks = (tasksQuery.data ?? []).filter(
    (t: WorkspaceTask) => !t.section_id || t.section_id === section.section_id,
  );

  const sectionComments = (commentsQuery.data ?? []).filter(
    (c: WorkspaceComment) => !c.section_id || c.section_id === section.section_id,
  );

  const handlePostComment = () => {
    if (commentText.trim()) {
      postCommentMutation.mutate(commentText.trim());
    }
  };

  return (
    <div data-testid="workspace-section-panel">
      {/* Section header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>{section.section_name}</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="gf-badge gf-badge--neutral">{section.status.replace('_', ' ')}</span>
          {section.owner_id && (
            <span className="gf-hint">Owner: {section.owner_id}</span>
          )}
          {section.internal_due_date && (
            <span className="gf-hint">Due: {section.internal_due_date}</span>
          )}
        </div>
      </div>

      {/* Read-only notice — shown when workspace is locked after submission */}
      {isLocked && (
        <div className="gf-alert gf-alert gf-alert--info" style={{ marginBottom: '1rem' }} role="status">
          <div >
            <p className="gf-alert__text">This section is read-only. The application has been submitted.</p>
          </div>
        </div>
      )}

      {/* Section content — route by section_type */}
      {section.section_type === 'budget' && (
        <BudgetBuilder workspaceId={workspaceId} isLocked={isLocked} />
      )}
      {section.section_type === 'attachments' && (
        <AttachmentManager workspaceId={workspaceId} isLocked={isLocked} />
      )}
      {/* For all other sections: SectionFormPanel handles field rendering (from Plan 04-03) */}
      {section.section_type !== 'budget' && section.section_type !== 'attachments' && (
        <SectionFormPanel section={section} workspaceId={workspaceId} onFieldBlur={onFieldBlur} isLocked={isLocked} />
      )}

      {/* Task list */}
      <section aria-label="Section tasks" style={{ marginBottom: '1.5rem' }}>
        <h3>Tasks</h3>
        {tasksQuery.isLoading ? (
          <p className="gf-hint">Loading tasks…</p>
        ) : sectionTasks.length === 0 ? (
          <p className="gf-hint">No tasks assigned to this section.</p>
        ) : (
          <ul >
            {sectionTasks.map((task: WorkspaceTask) => (
              <li key={task.task_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{task.task_title}</strong>
                  {task.task_due_date && (
                    <span className="gf-hint" style={{ marginLeft: '0.5rem' }}>
                      Due: {task.task_due_date}
                    </span>
                  )}
                  <span
                    className={task.status === 'complete' ? 'gf-badge gf-badge--neutral gf-badge gf-badge--success' : 'gf-badge gf-badge--neutral'}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    {task.status}
                  </span>
                </div>
                <button
                  type="button"
                  className="gf-btn gf-btn--primary gf-btn gf-btn--ghost"
                  onClick={() =>
                    updateTaskMutation.mutate({
                      taskId: task.task_id,
                      status: task.status === 'open' ? 'complete' : 'open',
                    })
                  }
                  disabled={updateTaskMutation.isPending || isLocked}
                >
                  {task.status === 'open' ? 'Mark complete' : 'Reopen'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Comment thread */}
      <section aria-label="Internal comments">
        <h3>Internal Comments</h3>
        {commentsQuery.isLoading ? (
          <p className="gf-hint">Loading comments…</p>
        ) : sectionComments.length === 0 ? (
          <p className="gf-hint">No comments yet.</p>
        ) : (
          <ul  style={{ marginBottom: '1rem' }}>
            {sectionComments.map((comment: WorkspaceComment) => (
              <li
                key={comment.comment_id}
                style={{
                  border: '1px solid #c9c9c9',
                  borderRadius: '4px',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                }}
              >
                <p style={{ margin: 0 }}>{comment.comment_text}</p>
                <span className="gf-hint" style={{ fontSize: '0.8rem' }}>
                  {new Date(comment.posted_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Comment input form */}
        <div>
          <label className="gf-label" htmlFor={`comment-input-${section.section_id}`}>
            Add a comment
          </label>
          <textarea
            id={`comment-input-${section.section_id}`}
            className="gf-textarea"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={5000}
            rows={3}
            placeholder="Internal comment (not visible to grantors)…"
            style={{ marginBottom: '0.5rem' }}
          />
          <button
            type="button"
            className="gf-btn gf-btn--primary"
            onClick={handlePostComment}
            disabled={!commentText.trim() || postCommentMutation.isPending || isLocked}
          >
            {postCommentMutation.isPending ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      </section>
    </div>
  );
}
