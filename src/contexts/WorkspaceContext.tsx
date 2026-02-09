import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface WorkspaceContextType {
    workspaceId: string | null;
    updateWorkspaceId: (id: string | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children, initialId }: { children: ReactNode, initialId?: string | null }) {
    const [workspaceId, setWorkspaceId] = useState<string | null>(() => {
        if (initialId !== undefined) return initialId;
        const params = new URLSearchParams(window.location.search);
        const ws = params.get('ws');
        return (ws && ws.trim() !== '') ? ws.trim() : null;
    });

    const updateWorkspaceId = useCallback((id: string | null) => {
        setWorkspaceId(id);

        const newParams = new URLSearchParams(window.location.search);
        if (id === null) {
            newParams.delete('ws');
        } else {
            newParams.set('ws', id);
        }

        const queryString = newParams.toString();
        const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
        window.history.replaceState(null, '', newUrl);
    }, []);

    const contextValue = useMemo(() => ({
        workspaceId,
        updateWorkspaceId,
    }), [workspaceId, updateWorkspaceId]);

    return (
        <WorkspaceContext.Provider value={contextValue}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within WorkspaceProvider');
    }
    return context;
}
