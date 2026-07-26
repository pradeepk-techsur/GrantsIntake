import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspaceApi';
import type { WorkspaceSection, WorkspaceTask, WorkspaceComment } from '../../types/workspace';

interface WorkspaceSectionPanelProps {
  section: WorkspaceSection;
  workspaceId: string;
}

export function WorkspaceSectionPanel({ section, workspaceId }: WorkspaceSectionPanelProps) {
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
    <div className="usa-prose">
      {/* Section header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>{section.section_name}</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="usa-tag">{section.status.replace('_', ' ')}</span>
          {section.owner_id && (
            <span className="usa-hint">Owner: {section.owner_id}</span>
          )}
          {section.internal_due_date && (
            <span className="usa-hint">Due: {section.internal_due_date}</span>
          )}
        </div>
      </div>

      {/* Section content placeholder — Phase 4 Plans 03/04 will fill in form fields */}
      <div className="usa-alert usa-alert--info usa-alert--slim" style={{ marginBottom: '1.5rem' }}>
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            Form fields for <strong>{section.section_name}</strong> will be added in upcoming phases.
          </p>
        </div>
      </div>

      {/* Task list */}
      <section aria-label="Section tasks" style={{ marginBottom: '1.5rem' }}>
        <h3>Tasks</h3>
        {tasksQuery.isLoading ? (
          <p className="usa-hint">Loading tasks…</p>
        ) : sectionTasks.length === 0 ? (
          <p className="usa-hint">No tasks assigned to this section.</p>
        ) : (
          <ul className="usa-list">
            {sectionTasks.map((task: WorkspaceTask) => (
              <li key={task.task_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{task.task_title}</strong>
                  {task.task_due_date && (
                    <span className="usa-hint" style={{ marginLeft: '0.5rem' }}>
                      Due: {task.task_due_date}
                    </span>
                  )}
                  <span
                    className={task.status === 'complete' ? 'usa-tag usa-tag--success' : 'usa-tag'}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    {task.status}
                  </span>
                </div>
                <button
                  type="button"
                  className="usa-button usa-button--unstyled"
                  onClick={() =>
                    updateTaskMutation.mutate({
                      taskId: task.task_id,
                      status: task.status === 'open' ? 'complete' : 'open',
                    })
                  }
                  disabled={updateTaskMutation.isPending}
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
          <p className="usa-hint">Loading comments…</p>
        ) : sectionComments.length === 0 ? (
          <p className="usa-hint">No comments yet.</p>
        ) : (
          <ul className="usa-list usa-list--unstyled" style={{ marginBottom: '1rem' }}>
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
                <span className="usa-hint" style={{ fontSize: '0.8rem' }}>
                  {new Date(comment.posted_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Comment input form */}
        <div>
          <label className="usa-label" htmlFor={`comment-input-${section.section_id}`}>
            Add a comment
          </label>
          <textarea
            id={`comment-input-${section.section_id}`}
            className="usa-textarea"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={5000}
            rows={3}
            placeholder="Internal comment (not visible to grantors)…"
            style={{ marginBottom: '0.5rem' }}
          />
          <button
            type="button"
            className="usa-button"
            onClick={handlePostComment}
            disabled={!commentText.trim() || postCommentMutation.isPending}
          >
            {postCommentMutation.isPending ? 'Posting…' : 'Post Comment'}
          </button>
        </div>
      </section>
    </div>
  );
}
