import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Trash2, Download, Upload } from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleExportData = () => {
    // This would export user data
    alert('Data export feature coming soon!');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion feature coming soon!');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'data', label: 'Data & Privacy', icon: Download },
    { id: 'account', label: 'Account', icon: LogOut }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            {activeTab === 'profile' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    Profile editing will be available in a future update.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Data & Privacy</h3>
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Export Your Data</h4>
                        <p className="text-sm text-gray-500">
                          Download all your quizzes, documents, and progress data
                        </p>
                      </div>
                      <button
                        onClick={handleExportData}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Data Storage</h4>
                        <p className="text-sm text-gray-500">
                          Your data is stored securely and encrypted
                        </p>
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        Secure
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Privacy Policy</h4>
                        <p className="text-sm text-gray-500">
                          Learn how we protect your data
                        </p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View Policy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Account Actions</h3>
                <div className="space-y-6">
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-900">Sign Out</h4>
                        <p className="text-sm text-red-700">
                          Sign out of your account on this device
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>

                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-900">Delete Account</h4>
                        <p className="text-sm text-red-700">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <button
                        onClick={handleDeleteAccount}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
