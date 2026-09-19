import { notFound } from 'next/navigation';
import ConnectionStatus from '@/components/ConnectionStatus';

export default function ConnectionTestPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <ConnectionStatus />;
}
