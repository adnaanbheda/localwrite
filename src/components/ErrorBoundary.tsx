import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode | ((error: Error) => ReactNode);
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.name || 'ErrorBoundary'}:`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (typeof this.props.fallback === 'function') {
                return this.props.fallback(this.state.error!);
            }
            return this.props.fallback || (
                <div className="p-4 border-2 border-dashed border-destructive/50 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <p className="font-bold">Error in {this.props.name || 'Component'}</p>
                    <p className="text-xs opacity-80 mt-1">{this.state.error?.message}</p>
                </div>
            );
        }

        return this.props.children;
    }
}
