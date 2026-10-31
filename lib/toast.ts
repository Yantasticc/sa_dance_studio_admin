type ToastCallback = (msg: { id: string; text: string; type: "success" | "error" | "info" }) => void;
const listeners = new Set<ToastCallback>();

export const toast = {
  success(text: string) {
    const id = Math.random().toString();
    listeners.forEach((cb) => cb({ id, text, type: "success" }));
  },
  error(text: string) {
    const id = Math.random().toString();
    listeners.forEach((cb) => cb({ id, text, type: "error" }));
  },
  info(text: string) {
    const id = Math.random().toString();
    listeners.forEach((cb) => cb({ id, text, type: "info" }));
  },
  subscribe(callback: ToastCallback) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
};
