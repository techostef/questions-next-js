import type { ErrorInfo } from "react";

export const sendErrorToServer = async (error: Error, errorInfo: ErrorInfo) => {
    try {
        await fetch('/api/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: error.name,
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                url: typeof window !== 'undefined' ? window.location.href : '',
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
                timestamp: new Date().toISOString()
            }),
        });
    } catch (logError) {
        // If we can't send the error to the server, log it to the console
        console.error('Failed to log error to server:', logError);
    }
}