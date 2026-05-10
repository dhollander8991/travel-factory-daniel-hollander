import { RequestStatus } from '@org/shared';

export const getStatusSeverity = (status: RequestStatus): string => {
  const map: Record<RequestStatus, string> = {
    [RequestStatus.PENDING]: 'warn',
    [RequestStatus.APPROVED]: 'success',
    [RequestStatus.REJECTED]: 'danger',
  };
  return map[status];
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getDayCount = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};
