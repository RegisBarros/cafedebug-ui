export type ApiResponse = {
  data: unknown;
  status: number;
  headers: Headers;
};

export const isErrorStatus = (status: number): boolean => status >= 400;

export const isSuccessStatus = (status: number): boolean =>
  status >= 200 && status < 300;
