import React, { createContext, useContext, useState } from 'react';

export type TabId = 'dashboard' | 'deliveries' | 'stores' | 'reports' | 'profile';

interface TabContextValue {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTabNav() {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error('useTabNav must be inside TabProvider');
  return ctx;
}
