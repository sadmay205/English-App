import MainLayout from './components/layout/MainLayout';
import AuthPage from './components/features/auth/AuthPage';
import useAuthStore from './store/useAuthStore';
import { Toaster } from 'sonner';

export default function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <>
      {user ? <MainLayout /> : <AuthPage />}
      <Toaster theme="dark" position="bottom-right" richColors />
    </>
  );
}

