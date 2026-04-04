/**
 * Structured logging utility with log levels.
 * Outputs different information based on NODE_ENV.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    error?: string;
    stack?: string;
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === "development";
    private logBuffer: LogEntry[] = [];
    private maxBufferSize = 100; // Keep last 100 logs in memory for debugging

    private formatEntry(entry: LogEntry): string {
        const time = entry.timestamp;
        const level = entry.level.toUpperCase().padEnd(5);

        let msg = `[${time}] ${level} ${entry.message}`;

        if (entry.context && Object.keys(entry.context).length > 0) {
            msg += ` ${JSON.stringify(entry.context)}`;
        }

        if (entry.error) {
            msg += `\nError: ${entry.error}`;
        }

        if (entry.stack && this.isDevelopment) {
            msg += `\nStack: ${entry.stack}`;
        }

        return msg;
    }

    private addToBuffer(entry: LogEntry) {
        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            error: error?.message,
            stack: error?.stack,
        };

        this.addToBuffer(entry);
        const formatted = this.formatEntry(entry);

        switch (level) {
            case "debug":
                if (this.isDevelopment) console.debug(formatted);
                break;
            case "info":
                console.info(formatted);
                break;
            case "warn":
                console.warn(formatted);
                break;
            case "error":
                console.error(formatted);
                break;
        }
    }

    debug(message: string, context?: Record<string, unknown>) {
        this.log("debug", message, context);
    }

    info(message: string, context?: Record<string, unknown>) {
        this.log("info", message, context);
    }

    warn(message: string, context?: Record<string, unknown>) {
        this.log("warn", message, context);
    }

    error(message: string, error?: Error, context?: Record<string, unknown>) {
        this.log("error", message, context, error);
    }

    /**
     * Get recent logs (useful for debugging in production).
     */
    getRecentLogs(count: number = 20): LogEntry[] {
        return this.logBuffer.slice(-count);
    }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Log API request/response for debugging.
 */
export function logApiCall(
    method: string,
    path: string,
    status: number,
    duration?: number,
    context?: Record<string, unknown>
) {
    logger.info(`API ${method} ${path} ${status}`, {
        method,
        path,
        status,
        duration_ms: duration,
        ...context,
    });
}

/**
 * Log API error with request context.
 */
export function logApiError(
    method: string,
    path: string,
    error: Error,
    context?: Record<string, unknown>
) {
    logger.error(`API ${method} ${path} failed`, error, {
        method,
        path,
        ...context,
    });
}
