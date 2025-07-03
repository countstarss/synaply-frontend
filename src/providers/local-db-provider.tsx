'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { localDb, LocalDatabase } from '@/lib/local-db';

const LocalDbContext = createContext<LocalDatabase | null>(null);

export const useLocalDb = () => {
  const context = useContext(LocalDbContext);
  if (!context) {
    throw new Error('useLocalDb must be used within a LocalDbProvider');
  }
  return context;
};

interface LocalDbProviderProps {
  children: React.ReactNode;
}

export const LocalDbProvider = ({ children }: LocalDbProviderProps) => {
  useEffect(() => {
    // You can perform any initial database setup or checks here if needed
    // For example, ensure the database is open
    localDb.open().catch((err) => {
      console.error('Failed to open local database:', err);
    });

    return () => {
      localDb.close();
    };
  }, []);

  return (
    <LocalDbContext.Provider value={localDb}>
      {children}
    </LocalDbContext.Provider>
  );
};
