import React, { createContext, useContext, useEffect } from 'react';
import useAuditLog from '../hooks/useAuditLog';
import auditBridge from '../utils/auditBridge';

const AuditLogContext = createContext(null);

export function AuditLogProvider({ children }) {
    const auditLog = useAuditLog();

    // Connect the module-level bridge to this context so the Axios interceptor
    // can record actions without having access to React context.
    useEffect(() => {
        auditBridge.register(auditLog.recordAction);
        return () => auditBridge.unregister();
    }, [auditLog.recordAction]);

    return <AuditLogContext.Provider value={auditLog}>{children}</AuditLogContext.Provider>;
}

export function useAuditLogContext() {
    const ctx = useContext(AuditLogContext);
    if (!ctx) throw new Error('useAuditLogContext must be used inside <AuditLogProvider>');
    return ctx;
}
