import { addToast, type ToastVariant } from "./toastStore";

function toast(variant: ToastVariant, message: string, duration?: number): number {
  return addToast(variant, message, duration);
}

/** Show a success toast. Requires `<ToastHost />` mounted once near the app root. */
export function toastSuccess(message: string, duration?: number): number {
  return toast("success", message, duration);
}

/** Show an error toast. Requires `<ToastHost />` mounted once near the app root. */
export function toastError(message: string, duration?: number): number {
  return toast("error", message, duration);
}

/** Show an info toast. Requires `<ToastHost />` mounted once near the app root. */
export function toastInfo(message: string, duration?: number): number {
  return toast("info", message, duration);
}
