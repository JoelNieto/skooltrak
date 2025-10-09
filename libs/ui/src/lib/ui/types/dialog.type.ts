export type DialogData = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'success' | 'info' | 'warning' | 'error';
  hideCancel?: boolean;
};
