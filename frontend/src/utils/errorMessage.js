export const getDisplayErrorMessage = (error, networkErrorMessage) =>
  /failed to fetch/i.test(error?.message || '')
    ? networkErrorMessage
    : error?.message || '';
