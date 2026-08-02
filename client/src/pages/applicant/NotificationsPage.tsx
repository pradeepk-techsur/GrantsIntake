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
export function NotificationsPage(): JSX.Element {
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
  // Accessed via Axios response.data
  const raw = data?.data;
  const notifications: Notification[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { notifications?: Notification[] })?.notifications)
      ? (raw as { notifications: Notification[] }).notifications
      : [];

  return (
    <div className="grid-container">
      <h1>Notifications</h1>

      {isLoading && <p>Loading notifications…</p>}

      {isError && (
        <div className="usa-alert usa-alert--error" role="alert">
          <div className="usa-alert__body">
            <p className="usa-alert__text">Failed to load notifications.</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && notifications.length === 0 && (
        <div
          className="usa-alert usa-alert--info"
          role="status"
          data-testid="notifications-empty"
        >
          <div className="usa-alert__body">
            <p className="usa-alert__text">You have no notifications yet.</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && notifications.length > 0 && (
        <ul className="usa-list usa-list--unstyled">
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
              <p className="text-base-dark font-sans-3xs">
                {new Date(notification.created_at).toLocaleString()}
              </p>
              {!notification.is_read && (
                <button
                  className="usa-button usa-button--unstyled"
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
