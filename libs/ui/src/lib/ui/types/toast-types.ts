export type ToastObject = {
  message: string;
  detail?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timeout?: number;
  id?: string;
};
