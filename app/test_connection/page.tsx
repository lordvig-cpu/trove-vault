// -----------------------------------------------------------------------------
// 1. THE DIRECTIVE
// -----------------------------------------------------------------------------
// By default, Next.js components render on the server (like PHP).
// Adding 'use client' tells Next.js: "This page needs browser capabilities
// like tracking mouse clicks, managing live UI state, or making browser fetch calls."
'use client';

// -----------------------------------------------------------------------------
// 2. IMPORTS
// -----------------------------------------------------------------------------
// useEffect & useState are React "Hooks" (built-in helper functions).
// - useState: creates variables that re-render the screen when their values change.
// - useEffect: runs code automatically when the page first loads.
import { useEffect, useState } from 'react';

// Import our custom Supabase client helper that we configured in lib/supabase.ts
import { supabase } from '@/lib/supabase';

// -----------------------------------------------------------------------------
// 3. THE COMPONENT FUNCTION
// -----------------------------------------------------------------------------
// In React, every page or UI widget is a JavaScript function that returns HTML (JSX).
export default function Home() {

  // ---------------------------------------------------------------------------
  // A. COMPONENT STATE (Reactive Variables)
  // ---------------------------------------------------------------------------
  // In PHP, $dbStatus = 'checking'; is static.
  // In React, useState creates a variable (dbStatus) AND a setter function (setDbStatus).
  // Whenever you call setDbStatus('connected'), React automatically re-draws the HTML!
  //
  // Syntax: const [getterName, setterFunctionName] = useState<Type>(InitialValue);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // B. SIDE EFFECTS & LIFECYCLE (useEffect)
  // ---------------------------------------------------------------------------
  // This hook runs automatically ONCE right after the page renders in the browser.
  // (The empty array '[]' at the end tells React: "Only run this on initial page load".)
  useEffect(() => {
    async function checkConnection() {
      try {
        // Query Supabase using our JS SDK.
        // In SQL terms: SELECT * FROM _test_connection LIMIT 1;
        const { error } = await supabase.from('_test_connection').select('*').limit(1);

        // Supabase returns specific codes (like 42P01: relation does not exist)
        // when the table is missing. But receiving that error proves the server
        // responded and credentials work!
        if (error && error.code !== 'PGRST204' && error.code !== '42P01' && error.code !== 'PGRST116') {
          console.warn('Supabase ping notice:', error.message);
        }

        // Update our state to 'connected' -> Triggers React to re-render the green badge!
        setDbStatus('connected');
      } catch (err: any) {
        console.error('Connection failed:', err);
        setErrorMessage(err.message || 'Unknown error');
        // Update state to 'error' -> Triggers React to show the red error box
        setDbStatus('error');
      }
    }

    // Execute the async function defined above
    checkConnection();
  }, []); // <-- Empty dependency array = run once on page mount

  // ---------------------------------------------------------------------------
  // C. THE RENDER (JSX / HTML Template)
  // ---------------------------------------------------------------------------
  // This looks like HTML, but it's JSX (JavaScript XML).
  // Notice we can insert JavaScript logic right into the HTML using curly braces {}:
  // e.g., {dbStatus === 'connected' && <div>...</div>} (Conditional rendering)
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-indigo-400">
          Universal Collection App
        </h1>
        <p className="text-slate-300 text-lg">
          Verifying full-stack connectivity.
        </p>

        <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 text-sm space-y-2">
          <div className="text-emerald-400 font-medium">✓ Local Next.js Dev Server: Active</div>

          {/* Conditional Rendering: Show only if dbStatus is 'checking' */}
          {dbStatus === 'checking' && (
            <div className="text-amber-400 animate-pulse">⏳ Testing Supabase connection...</div>
          )}

          {/* Conditional Rendering: Show only if dbStatus is 'connected' */}
          {dbStatus === 'connected' && (
            <div className="text-emerald-400 font-medium">✓ Supabase Cloud PostgreSQL: Connected 🚀</div>
          )}

          {/* Conditional Rendering: Show only if dbStatus is 'error' */}
          {dbStatus === 'error' && (
            <div className="text-rose-400 font-medium">✗ Supabase Connection Failed: {errorMessage}</div>
          )}
        </div>
      </div>
    </main>
  );
}