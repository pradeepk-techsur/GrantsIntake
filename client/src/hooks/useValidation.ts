import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { validationApi } from '../api/validationApi';

/**
 * useValidation — triggers POST /validate on field blur with 500ms debounce.
 * Invalidates the 'readiness' query so ReadinessDashboard picks up new errors.
 */
export function useValidation(workspaceId: string) {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerValidation = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await validationApi.runValidation(workspaceId);
        // Invalidate readiness so ReadinessDashboard refreshes blocking_count
        queryClient.invalidateQueries({ queryKey: ['readiness', workspaceId] });
      } catch {
        // Validation errors are non-fatal — UI continues
      }
    }, 500);
  }, [workspaceId, queryClient]);

  return { triggerValidation };
}
