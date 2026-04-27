import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

// --- IP Masking Helper ---
// Masks the last octet of IPv4 addresses to prevent PII leakage in log files.
// e.g. "192.168.1.105" => "192.168.1.x"
export const maskIp = (ip: string): string => {
  if (!ip) return "unknown";
  // IPv4
  const ipv4 = ip.replace(/(\d+\.\d+\.\d+\.)\d+/, "$1x");
  if (ipv4 !== ip) return ipv4;
  // IPv6 — mask last segment
  return ip.replace(/:[\da-fA-F]+$/, ":xxxx");
};

// --- Winston Transport: Daily rotating file for errors ---
const errorFileTransport = new DailyRotateFile({
  filename: "logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxFiles: "14d", // Keep 14 days of logs, auto-delete older
  zippedArchive: true,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
});

// --- Winston Transport: Daily rotating file for combined logs ---
const combinedFileTransport = new DailyRotateFile({
  filename: "logs/combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d",
  zippedArchive: true,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
});

const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "info",
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    errorFileTransport,
    combinedFileTransport,
  ],
});

export const logger = {
  info: (msg: string, meta?: any) => winstonLogger.info(msg, meta),
  error: (msg: string, meta?: any) => winstonLogger.error(msg, meta),
  warn: (msg: string, meta?: any) => winstonLogger.warn(msg, meta),
};
