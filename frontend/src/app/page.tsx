'use client';

import { useRouter } from 'next/navigation';
import Welcome from '../screens/Welcome';
import Avatar from '../components/Avatar';

export default function WelcomePage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/dashboard');
  };

  return (
    <Welcome
      onContinue={handleContinue}
      avatar={<Avatar />}
    />
  );
}
