'use client';

import { useEffect, useState } from 'react';
import { checkDatabaseConnection } from '@/lib/data/workspace';

export default function ConnectionStatus() {
  const [status, setStatus] = useState('Checking database access…');
  useEffect(() => {
    const controller = new AbortController();
    async function check() {
      try {
        await checkDatabaseConnection(controller.signal);
        if (!controller.signal.aborted) setStatus('Database query succeeded.');
      } catch (error: unknown) {
        if (!controller.signal.aborted) setStatus(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    void check();
    return () => controller.abort();
  }, []);
  return <main className="min-h-screen p-6 ui-primary"><h1>Database connection check</h1><p role="status">{status}</p></main>;
}
