'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';

interface SignOutButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SignOutButton({ 
  variant = 'outline', 
  size = 'sm',
  className 
}: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ 
      redirect: false,
      callbackUrl: '/login'
    });
    router.push('/login');
    router.refresh();
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleSignOut}
      className={className}
    >
      Abmelden
    </Button>
  );
}

