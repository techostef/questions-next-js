import type { ErrorInfo } from "react";

interface CustomErrorInfo extends Partial<ErrorInfo> {
    componentStack?: string;
    [key: string]: unknown;
}

export const sendErrorToServer = async (error: unknown, errorInfo: CustomErrorInfo = {}) => {
    try {
        // Handle when error is not an Error object
        const errorObject = error instanceof Error ? error : {
            name: 'UnknownError',
            message: String(error),
            stack: 'No stack trace available',
        };

        await fetch('/api/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: errorObject.name,
                message: errorObject.message,
                stack: errorObject.stack,
                componentStack: errorInfo.componentStack || 'No component stack available',
                url: typeof window !== 'undefined' ? window.location.href : '',
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
                browserInfo: {
                    languages: typeof window !== 'undefined' ? navigator.languages : [],
                    platform: typeof window !== 'undefined' ? navigator.platform : '',
                    vendor: typeof window !== 'undefined' ? navigator.vendor : '',
                },
                timestamp: new Date().toISOString(),
                ...errorInfo,
            }),
        });
    } catch (logError) {
        // If we can't send the error to the server, log it to the console
        console.error('Failed to log error to server:', logError);
    }
}