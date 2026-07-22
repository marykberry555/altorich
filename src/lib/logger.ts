type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function formatMessage(level: LogLevel, message: string, context?: LogContext) {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    service: "altorich",
    ...context
  });
}

function write(level: LogLevel, message: string, context?: LogContext) {
  const safeContext = context
    ? Object.fromEntries(
        Object.entries(context).filter(([key]) => !/pin_hash|password|secret|service_role/i.test(key))
      )
    : undefined;
  // Never serialize credential material if nested under known keys
  if (safeContext) {
    for (const [key, value] of Object.entries(safeContext)) {
      if (typeof value === "string" && /scrypt:|pin_hash/i.test(value)) {
        safeContext[key] = "[redacted]";
      }
    }
  }
  const line = formatMessage(level, message, safeContext);

  switch (level) {
    case "debug":
      if (process.env.NODE_ENV === "development") {
         
        console.debug(line);
      }
      break;
    case "info":
       
      console.info(line);
      break;
    case "warn":
       
      console.warn(line);
      break;
    case "error":
       
      console.error(line);
      break;
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => write("debug", message, context),
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context)
};
