'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, logout, isLoggedIn } from '@/services/auth.service';

type UserData = ReturnType<typeof getUser>;

export default function AdminDashboard() {
  const router = useRouter();
  const [state, setState] = useState<{ userData: UserData; checked: boolean }>({
    userData: null,
    checked: false,
  });

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    const user = getUser();
    setState({ userData: user, checked: true });

    if (user?.role !== 'Admin' && user?.role !== 'Manager') {
      router.push('/dashboard');
    }
  }, [router]);

  const { userData, checked } = state;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!checked || !userData) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">SF Booking — Admin</h1>
          <p className="text-xs text-gray-500">{userData.organizationName}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/profile" className="text-right hover:opacity-70 transition-opacity cursor-pointer">
            <p className="text-sm font-medium text-gray-900">{userData.fullName}</p>
            <p className="text-xs text-purple-600 font-medium">{userData.role}</p>
          </Link>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Admin dashboard</h2>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total bookings</p>
            <p className="text-2xl font-semibold text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Pending approval</p>
            <p className="text-2xl font-semibold text-yellow-600">0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Pending accounts</p>
            <p className="text-2xl font-semibold text-blue-600">0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total facilities</p>
            <p className="text-2xl font-semibold text-green-600">0</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Manage</h3>
            <div className="space-y-2">
              <button className="w-full text-left text-sm text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
                Pending booking approvals
              </button>
              <button className="w-full text-left text-sm text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
                Pending user accounts
              </button>
              <button className="w-full text-left text-sm text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
                Manage facilities
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Recent activity</h3>
            <p className="text-sm text-gray-400">No recent activity yet.</p>
          </div>
        </div>
      </main>
    </div>
  );
}