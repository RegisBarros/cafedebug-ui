import { redactSensitiveData, sanitizeLogContext } from "./redaction.js";

const LOG_LEVELS = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
});

const resolveRuntimeLogLevel = () => {
  const rawValue = process.env.ADMIN_LOG_LEVEL?.trim().toLowerCase();

  if (rawValue && rawValue in LOG_LEVELS) {
    return rawValue;
  }

  return process.env.NODE_ENV === "development" ? "debug" : "info";
};

const activeLogLevel = resolveRuntimeLogLevel();

const shouldLog = (level) => LOG_LEVELS[level] >= LOG_LEVELS[activeLogLevel];

const stringifyForConsole = (entry) => JSON.stringify(redactSensitiveData(entry));

const createBaseEntry = (level, event, context = {}) => ({
  timestamp: new Date().toISOString(),
  level,
  app: "cafedebug-admin",
  runtime:
    process.env.NEXT_RUNTIME === "edge"
      ? "edge"
      : typeof window === "undefined"
        ? "server"
        : "client",
  event,
  context: sanitizeLogContext(context)
});

const writeLog = (level, event, context = {}) => {
  if (!shouldLog(level)) {
    return;
  }

  const logEntry = createBaseEntry(level, event, context);
  const serializedEntry = stringifyForConsole(logEntry);

  if (level === "error") {
    console.error(serializedEntry);
    return;
  }

  if (level === "warn") {
    console.warn(serializedEntry);
    return;
  }

  if (level === "info") {
    console.info(serializedEntry);
    return;
  }

  console.debug(serializedEntry);
};

export const logger = {
  debug: (event, context) => writeLog("debug", event, context),
  info: (event, context) => writeLog("info", event, context),
  warn: (event, context) => writeLog("warn", event, context),
  error: (event, context) => writeLog("error", event, context)
};
