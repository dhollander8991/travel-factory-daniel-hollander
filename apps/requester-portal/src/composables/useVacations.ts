import { ref, computed } from 'vue';
import { onUnmounted } from 'vue';
import { VacationRequest, RequestStatus } from '@org/shared';
import api from '../services/axios';

/**
 * useVacations composable — manages all vacation request state and API calls
 * This is Vue's equivalent of a React custom hook
 * Keeps all data fetching and business logic out of the component
 */
export const useVacations = (userId: string) => {
  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────

  const requests = ref<VacationRequest[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Active status filter — null means show all
  const activeFilter = ref<RequestStatus | null>(null);

  // Search query — filters requests by reason or date
  const searchQuery = ref<string>('');

  // Sort value — controls ordering of filtered results
  const selectedSort = ref<string>('newest');

  const startDateFilter = ref<Date | null>(null);
  const endDateFilter = ref<Date | null>(null);

  // ─────────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────────

  const filteredRequests = computed(() => {
    let result = requests.value;

    // Apply status filter
    if (activeFilter.value) {
      result = result.filter((r) => r.status === activeFilter.value);
    }

    // Apply search filter — checks reason and dates
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(
        (r) => r.reason?.toLowerCase().includes(query)
      );
    }

    if (startDateFilter.value) {
      const from = startDateFilter.value.getTime();
      result = result.filter((r) => new Date(r.endDate).getTime() >= from);
    }

    if (endDateFilter.value) {
      const to = endDateFilter.value.getTime();
      result = result.filter((r) => new Date(r.startDate).getTime() <= to);
    }

    // Apply sorting
    // slice() creates a shallow copy so we don't mutate the original array
    // Mutating reactive arrays directly can cause unexpected Vue reactivity issues
    result = result.slice().sort((a, b) => {
      if (selectedSort.value === 'newest') {
        // Descending by createdAt — most recent first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (selectedSort.value === 'oldest') {
        // Ascending by createdAt — oldest first
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (selectedSort.value === 'duration') {
        // Descending by duration — longest request first
        const daysA = new Date(a.endDate).getTime() - new Date(a.startDate).getTime();
        const daysB = new Date(b.endDate).getTime() - new Date(b.startDate).getTime();
        return daysB - daysA;
      }
      return 0;
    });

    return result;
  });

  // Stats derived from ALL requests — not filtered
  // So sidebar counts always show totals regardless of active filter
  const stats = computed(() => ({
    total: requests.value.length,
    pending: requests.value.filter((r) => r.status === RequestStatus.PENDING).length,
    approved: requests.value.filter((r) => r.status === RequestStatus.APPROVED).length,
    rejected: requests.value.filter((r) => r.status === RequestStatus.REJECTED).length,
    // Total approved days — shown in the stats row
    totalDays: requests.value
      .filter((r) => r.status === RequestStatus.APPROVED)
      .reduce((acc, r) => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        // +1 because both start and end dates are inclusive
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return acc + days;
      }, 0),
  }));

  // ─────────────────────────────────────────────
  // FETCH REQUESTS
  // ─────────────────────────────────────────────

  /**
   * Fetches all requests for the current user from the API
   */
  const fetchRequests = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/api/v1/users/${userId}/requests`);
      requests.value = response.data.data;
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to load requests';
    } finally {
      // Always resets loading whether success or error
      loading.value = false;
    }
  };

  // ─────────────────────────────────────────────
  // SUBMIT REQUEST
  // ─────────────────────────────────────────────

  interface SubmitRequestParams {
    startDate: string;
    endDate: string;
    reason?: string;
  }

  /**
   * Submits a new vacation request
   * Throws on error so the component can handle and display the right message
   * @param params.startDate - Start date in YYYY-MM-DD format
   * @param params.endDate - End date in YYYY-MM-DD format
   * @param params.reason - Optional reason for the request
   */
  const submitRequest = async ({ startDate, endDate, reason }: SubmitRequestParams): Promise<void> => {
    const response = await api.post('/api/v1/requests', {
      userId,
      startDate,
      endDate,
      reason,
    });

    // Prepend the new request to the list
    // More efficient than refetching everything from the server
    requests.value = [response.data.data, ...requests.value];
  };

  // ─────────────────────────────────────────────
  // POLLING
  // ─────────────────────────────────────────────

  let pollInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Starts polling the API every 30 seconds
   * Keeps the request list in sync when the validator
   * approves or rejects a request without the user refreshing
   */
  const startPolling = (): void => {
    // Clear any existing interval first — prevents duplicate polling
    stopPolling();
    pollInterval = setInterval(() => {
      fetchRequests();
    }, 30000); // 30 seconds
  };

  /**
   * Stops polling — should be called when the component unmounts
   * Always clean up intervals to prevent memory leaks
   */
  const stopPolling = (): void => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  // Auto-cleanup if composable goes out of scope
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
    selectedSort,
    startDateFilter,
    endDateFilter,
    stats,
    fetchRequests,
    submitRequest,
    startPolling,
    stopPolling,
  };
};