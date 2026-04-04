"use client";

import React, { ReactNode, ErrorInfo } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch React errors.
 * Prevents entire app from crashing if a component fails.
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error,
            errorInfo,
        });

        // Log to console in development
        if (process.env.NODE_ENV === "development") {
            console.error("Error caught by boundary:", error, errorInfo);
        }

        // Log to external service in production
        if (process.env.NODE_ENV === "production") {
            // Could send to Sentry, LogRocket, etc.
            console.error("Error caught by boundary:", error.message);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className="w-full p-6 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex gap-4">
                            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h2 className="text-lg font-semibold text-red-900 mb-2">
                                    Algo deu errado
                                </h2>
                                <p className="text-red-700 mb-3">
                                    Ocorreu um erro ao renderizar este componente. Tente recarregar a página.
                                </p>
                                {process.env.NODE_ENV === "development" && this.state.error && (
                                    <details className="mt-4 p-3 bg-red-100 rounded text-sm font-mono text-red-800">
                                        <summary className="cursor-pointer font-semibold">
                                            Detalhes do erro (Desenvolvimento)
                                        </summary>
                                        <pre className="mt-2 overflow-auto max-h-48">
                                            {this.state.error.toString()}
                                            {"\n\n"}
                                            {this.state.errorInfo?.componentStack}
                                        </pre>
                                    </details>
                                )}
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                >
                                    Recarregar página
                                </button>
                            </div>
                        </div>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}
