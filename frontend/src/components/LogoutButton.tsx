'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem('tesla_pool_user');
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:text-slate-900 transition-colors"
    >
      Logout
    </button>
  );
}
