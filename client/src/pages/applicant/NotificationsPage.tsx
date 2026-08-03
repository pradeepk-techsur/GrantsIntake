import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intakeQueueApi } from '../../api/intakeQueueApi';
import type { Notification } from '../../types/intakeQueue';

/**
 * NotificationsPage — applicant view of their notification records.
 *
 * Fetches GET /api/v1/notifications via intakeQueueApi.getNotifications.
 * Supports marking individual notifications as read via
 * intakeQueueApi.markRead (PUT /api/v1/notifications/:id/read).
 *
 * PRD-INTAKE-062 — applicant status dashboard / notification loop closure.
 */
export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => intakeQueueApi.getNotifications(),
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => intakeQueueApi.markRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // The API returns { notifications: Notification[], total: number }
  // Accessed via Axios response.data — typed via NotificationsResponse generic
  const notifications: Notification[] = data?.data?.notifications ?? [];

  return (
    <div >
      <h1>Notifications</h1>

      {isLoading && <p>Loading notifications…</p>}

      {isError && (
        <div className="gf-alert gf-alert gf-alert--error" role="alert">
          <div >
            <p className="gf-alert__text">Failed to load notifications.</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && notifications.length === 0 && (
        <div
          className="gf-alert gf-alert gf-alert--info"
          role="status"
          data-testid="notifications-empty"
        >
          <div >
            <h4 className="gf-alert__title">No notifications</h4>
            <p className="gf-alert__text">You have no notifications yet.</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && notifications.length > 0 && (
        <ul >
          {notifications.map((notification) => (
            <li
              key={notification.notification_id}
              data-testid="notification-item"
              className={
                !notification.is_read
                  ? 'border-left-05 border-primary padding-left-1 margin-bottom-2'
                  : 'margin-bottom-2'
              }
            >
              <strong data-testid="notification-title">{notification.title}</strong>
              <p data-testid="notification-body">{notification.body}</p>
              <p className="text-base-dark">
                {new Date(notification.created_at).toLocaleString()}
              </p>
              {!notification.is_read && (
                <button
                  className="gf-btn gf-btn--primary gf-btn gf-btn--ghost"
                  data-testid="mark-read-button"
                  onClick={() => markReadMutation.mutate(notification.notification_id)}
                >
                  Mark as read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
