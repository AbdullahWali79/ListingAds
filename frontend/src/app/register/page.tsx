'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to login page which now has combined form
    router.push('/login');
  }, [router]);

  return null;
}

