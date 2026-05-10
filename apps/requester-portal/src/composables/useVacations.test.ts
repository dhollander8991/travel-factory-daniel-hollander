/**
 * Tests for the useVacations composable — covers data fetching, request
 * submission, computed filtering/sorting/stats, and the polling lifecycle.
 * The axios instance and setInterval are mocked; no real HTTP calls are made.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { useVacations } from './useVacations';
import api from '../services/axios';
import { RequestStatus, UserRole } from '@org/shared';

vi.mock('../services/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

/** Mounts a headless component that runs the composable inside a real Vue scope. */
function withSetup<T>(fn: () => T): { result: T; unmount: () => void } {
  let result!: T;
  const wrapper = mount(
    defineComponent({
      setup() {
        result = fn();
        return {};
      },
      template: '<div />',
    }),
  );
  return { result, unmount: () => wrapper.unmount() };
}

const makeRequest = (overrides = {}) => ({
  id: 'r1',
  user: { id: 'u1', name: 'Alice', email: 'alice@example.com', role: UserRole.REQUESTER },
  startDate: '2099-08-01',
  endDate: '2099-08-05',
  reason: 'Holiday',
  status: RequestStatus.PENDING,
  comments: null,
  createdAt: '2099-07-01T10:00:00.000Z',
  ...overrides,
});

describe('fetchRequests', () => {
  it('populates requests on success and resets loading', async () => {
    const fakeRequests = [makeRequest()];
    vi.mocked(api.get).mockResolvedValue({ data: { data: fakeRequests } });

    const { result } = withSetup(() => useVacations('u1'));

    expect(result.loading.value).toBe(false);
    result.fetchRequests();
    expect(result.loading.value).toBe(true);

    await flushPromises();

    expect(result.requests.value).toEqual(fakeRequests);
    expect(result.loading.value).toBe(false);
    expect(api.get).toHaveBeenCalledWith('/api/v1/users/u1/requests');
  });

  it('sets error and resets loading when the request fails', async () => {
    vi.mocked(api.get).mockRejectedValue({
      response: { data: { error: { message: 'Server error' } } },
    });

    const { result } = withSetup(() => useVacations('u1'));
    await result.fetchRequests();

    expect(result.error.value).toBe('Server error');
    expect(result.loading.value).toBe(false);
  });
});

describe('submitRequest', () => {
  it('prepends the new request to the existing list', async () => {
    const existing = makeRequest({ id: 'r-old', createdAt: '2099-07-01T09:00:00.000Z' });
    const created = makeRequest({ id: 'r-new', createdAt: '2099-07-01T12:00:00.000Z' });

    vi.mocked(api.get).mockResolvedValue({ data: { data: [existing] } });
    vi.mocked(api.post).mockResolvedValue({ data: { data: created } });

    const { result } = withSetup(() => useVacations('u1'));
    await result.fetchRequests();
    await flushPromises();

    await result.submitRequest({ startDate: '2099-09-01', endDate: '2099-09-05' });

    expect(result.requests.value[0].id).toBe('r-new');
    expect(result.requests.value).toHaveLength(2);
  });

  it('throws when the API call fails so the component can handle the error', async () => {
    const apiError = { response: { data: { error: { message: 'Conflict' } } } };
    vi.mocked(api.post).mockRejectedValue(apiError);

    const { result } = withSetup(() => useVacations('u1'));

    await expect(
      result.submitRequest({ startDate: '2099-09-01', endDate: '2099-09-05' }),
    ).rejects.toEqual(apiError);
  });
});

describe('filteredRequests computed', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
  });

  it('returns all requests when no filter or search is set', async () => {
    const requests = [
      makeRequest({ id: 'r1', status: RequestStatus.PENDING }),
      makeRequest({ id: 'r2', status: RequestStatus.APPROVED }),
    ];
    vi.mocked(api.get).mockResolvedValue({ data: { data: requests } });

    const { result } = withSetup(() => useVacations('u1'));
    await result.fetchRequests();
    await flushPromises();

    expect(result.filteredRequests.value).toHaveLength(2);
  });

  it('filters by active status', async () => {
    const requests = [
      makeRequest({ id: 'r1', status: RequestStatus.PENDING }),
      makeRequest({ id: 'r2', status: RequestStatus.APPROVED }),
    ];
    vi.mocked(api.get).mockResolvedValue({ data: { data: requests } });

    const { result } = withSetup(() => useVacations('u1'));
    await result.fetchRequests();
    await flushPromises();

    result.activeFilter.value = RequestStatus.PENDING;
    await nextTick();

    expect(result.filteredRequests.value).toHaveLength(1);
    expect(result.filteredRequests.value[0].id).toBe('r1');
  });

  it('filters by search query matching the reason', async () => {
    const requests = [
      makeRequest({ id: 'r1', reason: 'Family vacation' }),
      makeRequest({ id: 'r2', reason: 'Medical leave' }),
    ];
    vi.mocked(api.get).mockResolvedValue({ data: { data: requests } });

    const { result } = withSetup(() => useVacations('u1'));
    await result.fetchRequests();
    await flushPromises();

    result.searchQuery.value = 'medical';
    await nextTick();

    expect(result.filteredRequests.value).toHaveLength(1);
    expect(result.filteredRequests.value[0].id).toBe('r2');
  });

  it('sorts by oldest when selectedSort is "oldest"', async () => {
    const requests = [
      makeRequest({ id: 'r-new', createdAt: '2099-07-02T00:00:00.000Z' }),
      makeRequest({ id: 'r-old', createdAt: '2099-07-01T00:00:00.000Z' }),
    ];
    vi.mocked(api.get).mockResolvedValue({ data: { data: requests } });

    const { result } = withSetup(() => useVacations('u1'));
    await result.fetchRequests();
    await flushPromises();

    result.selectedSort.value = 'oldest';
    await nextTick();

    expect(result.filteredRequests.value[0].id).toBe('r-old');
  });

  it('sorts by duration descending when selectedSort is "duration"', async () => {
    const requests = [
      makeRequest({ id: 'r-short', startDate: '2099-08-01', endDate: '2099-08-02' }),
      makeRequest({ id: 'r-long', startDate: '2099-08-01', endDate: '2099-08-10' }),
    ];
    vi.mocked(api.get).mockResolvedValue({ data: { data: requests } });

    const { result } = withSetup(() => useVacations('u1'));
    await result.fetchRequests();
    await flushPromises();

    result.selectedSort.value = 'duration';
    await nextTick();

    expect(result.filteredRequests.value[0].id).toBe('r-long');
  });
});

describe('stats computed', () => {
  it('calculates totals and approved day count correctly', async () => {
    const requests = [
      makeRequest({ id: 'r1', status: RequestStatus.PENDING }),
      makeRequest({
        id: 'r2',
        status: RequestStatus.APPROVED,
        startDate: '2099-08-01',
        endDate: '2099-08-05', // 5 days inclusive
      }),
      makeRequest({ id: 'r3', status: RequestStatus.REJECTED }),
    ];
    vi.mocked(api.get).mockResolvedValue({ data: { data: requests } });

    const { result } = withSetup(() => useVacations('u1'));
    await result.fetchRequests();
    await flushPromises();

    expect(result.stats.value.total).toBe(3);
    expect(result.stats.value.pending).toBe(1);
    expect(result.stats.value.approved).toBe(1);
    expect(result.stats.value.rejected).toBe(1);
    expect(result.stats.value.totalDays).toBe(5);
  });
});

describe('polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires fetchRequests after 30 seconds when polling is active', async () => {
    const { result } = withSetup(() => useVacations('u1'));

    result.startPolling();
    vi.advanceTimersByTime(30000);
    await flushPromises();

    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('stops firing after stopPolling is called', async () => {
    const { result } = withSetup(() => useVacations('u1'));

    result.startPolling();
    result.stopPolling();
    vi.advanceTimersByTime(60000);
    await flushPromises();

    expect(api.get).not.toHaveBeenCalled();
  });

  it('clears the interval automatically when the component unmounts', async () => {
    const { result, unmount } = withSetup(() => useVacations('u1'));

    result.startPolling();
    unmount();
    vi.advanceTimersByTime(30000);
    await flushPromises();

    expect(api.get).not.toHaveBeenCalled();
  });
});
