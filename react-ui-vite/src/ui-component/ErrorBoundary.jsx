import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 24 }}>
                    <h2>Algo salió mal al cargar esta página.</h2>
                    <pre style={{ whiteSpace: 'pre-wrap', color: 'red', fontSize: 12 }}>
                        {this.state.error?.message}
                    </pre>
                    <button onClick={() => this.setState({ hasError: false, error: null })}>
                        Reintentar
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
