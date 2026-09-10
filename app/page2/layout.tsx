'use client';

import React from 'react';
import { UIPreferencesProvider } from '@/context/UIPreferencesContext2';

export default function Page2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UIPreferencesProvider>
      {children}
    </UIPreferencesProvider>
  );
}