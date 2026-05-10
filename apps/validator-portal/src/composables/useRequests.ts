import { ref, computed, onUnmounted } from 'vue';
import { VacationRequest, RequestStatus } from '@org/shared';
import api from '../services/axios';

/**
 * useRequests composable — manages all requests state for the validator dashboard
 * Handles fetching all requests, filtering, sorting, and approve/reject actions
 */
export const useRequests = () => {
  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────

  const requests = ref<VacationRequest[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const activeFilter = ref<RequestStatus | null>(null);
  const searchQuery = ref<string>('');
  const selectedEmployee = ref<string | null>(null);
  const selectedSort = ref<string>('newest');
  const startDateFilter = ref<Date | null>(null);
  const endDateFilter = ref<Date | null>(null);

  // Multi-select state — array of selected request IDs
  const selectedIds = ref<string[]>([]);

  // ─────────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────────

  const filteredRequests = computed(() => {
    let result = requests.value;

    if (activeFilter.value) {
      result = result.filter((r) => r.status === activeFilter.value);
    }

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(
        (r) =>
          r.user.name.toLowerCase().includes(query) ||
          r.reason?.toLowerCase().includes(query)
      );
    }

    if (selectedEmployee.value) {
      result = result.filter((r) => r.user.id === selectedEmployee.value);
    }

    if (startDateFilter.value) {
      const from = startDateFilter.value.getTime();
      result = result.filter((r) => new Date(r.endDate).getTime() >= from);
    }

    if (endDateFilter.value) {
      const to = endDateFilter.value.getTime();
      result = result.filter((r) => new Date(r.startDate).getTime() <= to);
    }

    result = result.slice().sort((a, b) => {
      if (selectedSort.value === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (selectedSort.value === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (selectedSort.value === 'duration') {
        const daysA = new Date(a.endDate).getTime() - new Date(a.startDate).getTime();
        const daysB = new Date(b.endDate).getTime() - new Date(b.startDate).getTime();
        return daysB - daysA;
      }
      return 0;
    });

    return result;
  });

  const stats = computed(() => ({
    total: requests.value.length,
    pending: requests.value.filter((r) => r.status === RequestStatus.PENDING).length,
    approved: requests.value.filter((r) => r.status === RequestStatus.APPROVED).length,
    rejected: requests.value.filter((r) => r.status === RequestStatus.REJECTED).length,
  }));

  // Unique employees derived from all requests — for the sidebar filter
  const employees = computed(() => {
    const seen = new Set<string>();
    return requests.value
      .filter((r) => {
        if (seen.has(r.user.id)) return false;
        seen.add(r.user.id);
        return true;
      })
      .map((r) => r.user);
  });

  const selectedRequests = computed(() =>
    requests.value.filter((r) => selectedIds.value.includes(r.id))
  );

  // Bulk reject is only allowed when all selected requests belong to the same user
  const canBulkReject = computed(() => {
    if (selectedRequests.value.length === 0) return false;
    const firstUserId = selectedRequests.value[0].user.id;
    return selectedRequests.value.every((r) => r.user.id === firstUserId);
  });

  const allSelectedPending = computed(() =>
    selectedRequests.value.every((r) => r.status === RequestStatus.PENDING)
  );

  // ─────────────────────────────────────────────
  // FETCH ALL REQUESTS
  // ─────────────────────────────────────────────

  const fetchRequests = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/api/v1/requests');
      requests.value = response.data.data;
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to load requests';
    } finally {
      loading.value = false;
    }
  };

  // ─────────────────────────────────────────────
  // APPROVE REQUEST
  // ─────────────────────────────────────────────

  interface ApproveRequestParams {
    requestId: string;
  }

  const approveRequest = async ({ requestId }: ApproveRequestParams): Promise<void> => {
    const response = await api.patch(`/api/v1/requests/${requestId}`, {
      status: RequestStatus.APPROVED,
    });

    const index = requests.value.findIndex((r) => r.id === requestId);
    if (index !== -1) {
      requests.value[index] = response.data.data;
    }
  };

  // ─────────────────────────────────────────────
  // REJECT REQUEST
  // ─────────────────────────────────────────────

  interface RejectRequestParams {
    requestId: string;
    comments: string;
  }

  const rejectRequest = async ({ requestId, comments }: RejectRequestParams): Promise<void> => {
    const response = await api.patch(`/api/v1/requests/${requestId}`, {
      status: RequestStatus.REJECTED,
      comments,
    });

    const index = requests.value.findIndex((r) => r.id === requestId);
    if (index !== -1) {
      requests.value[index] = response.data.data;
    }
  };

  // ─────────────────────────────────────────────
  // BULK APPROVE / REJECT
  // ─────────────────────────────────────────────

  const bulkApprove = async (): Promise<void> => {
    await Promise.all(
      selectedIds.value.map((id) => approveRequest({ requestId: id }))
    );
    selectedIds.value = [];
  };

  interface BulkRejectParams {
    comments: string;
  }

  const bulkReject = async ({ comments }: BulkRejectParams): Promise<void> => {
    await Promise.all(
      selectedIds.value.map((id) => rejectRequest({ requestId: id, comments }))
    );
    selectedIds.value = [];
  };

  // ─────────────────────────────────────────────
  // SELECTION HELPERS
  // ─────────────────────────────────────────────

  const toggleSelect = (id: string): void => {
    const index = selectedIds.value.indexOf(id);
    if (index === -1) {
      selectedIds.value.push(id);
    } else {
      selectedIds.value.splice(index, 1);
    }
  };

  const clearSelection = (): void => {
    selectedIds.value = [];
  };

  // ─────────────────────────────────────────────
  // POLLING
  // ─────────────────────────────────────────────

  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const startPolling = (): void => {
    stopPolling();
    pollInterval = setInterval(() => {
      fetchRequests();
    }, 30000);
  };

  const stopPolling = (): void => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  onUnmounted(() => {
    stopPolling();
  });

  // ─────────────────────────────────────────────
  // RETURN
  // ─────────────────────────────────────────────

  return {
    requests,
    filteredRequests,
    loading,
    error,
    activeFilter,
    searchQuery,
    selectedEmployee,
    selectedSort,
    startDateFilter,
    endDateFilter,
    selectedIds,
    selectedRequests,
    canBulkReject,
    allSelectedPending,
    stats,
    employees,
    fetchRequests,
    approveRequest,
    rejectRequest,
    bulkApprove,
    bulkReject,
    toggleSelect,
    clearSelection,
    startPolling,
    stopPolling,
  };
};
