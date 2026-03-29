export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(`[INFO] ${message}`, data || "");
  },

  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error || "");
  },

  warn: (message: string) => {
    console.warn(`[WARN] ${message}`);
  },
};

export function logEvent(event: string, data: any = {}) {
  console.log(
    `[${new Date().toISOString()}] ${event}:`,
    JSON.stringify(data, null, 2)
  );
}