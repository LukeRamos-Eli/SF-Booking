'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout, isLoggedIn } from '@/services/auth.service';

export default function Dashboard() {
  const router = useRouter();
  const userData = typeof window !== 'undefined' ? getUser() : null;

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    if (userData?.role === 'Admin' || userData?.role === 'Manager') {
      router.push('/admin/dashboard');
    }
  }, [router, userData?.role]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!userData) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">SF Booking</h1>
          <p className="text-xs text-gray-500">{userData.organizationName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{userData.fullName}</p>
            <p className="text-xs text-gray-500">{userData.role}</p>
          </div>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h2>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Pending bookings</p>
            <p className="text-2xl font-semibold text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Approved bookings</p>
            <p className="text-2xl font-semibold text-green-600">0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Rejected bookings</p>
            <p className="text-2xl font-semibold text-red-600">0</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Quick actions</h3>
          <div className="flex gap-3">
            <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Book a facility
            </button>
            <button className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              View my bookings
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}