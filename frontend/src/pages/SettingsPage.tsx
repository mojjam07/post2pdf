import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <MainLayout title="Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Profile Settings</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                {user?.username}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                {user?.email || 'Not set'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">About</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">App Name</span>
              <span className="text-gray-900">DocManager</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Version</span>
              <span className="text-gray-900">1.0.0</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
