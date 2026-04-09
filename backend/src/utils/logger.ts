import fs from "fs";
export const logger = {
  info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ""),
  error: (msg: string, meta?: any) => {
    const logStr = `[ERROR] ${msg} ${meta ? JSON.stringify(meta) : ""}\n`;
    fs.appendFileSync("error.log", logStr);
    console.error(logStr);
  },
  warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || ""),
};
