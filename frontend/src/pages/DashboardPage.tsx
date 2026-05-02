import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Clock, Loader2, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { documentApi } from '../services/api';
import type { DocumentListItem } from '../types';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  done: { label: 'Done', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => documentApi.getStats(),
  });

  if (isLoading) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Dashboard">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-500">Failed to load dashboard</p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const stats = [
    { label: 'Total Documents', value: data?.total || 0, color: 'bg-purple-100 text-purple-700', icon: FileText },
    { label: 'Pending', value: data?.pending || 0, color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    { label: 'Processing', value: data?.processing || 0, color: 'bg-blue-100 text-blue-700', icon: Loader2 },
    { label: 'Completed', value: data?.done || 0, color: 'bg-green-100 text-green-700', icon: CheckCircle },
  ];

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/documents/new" className="flex-1">
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  New Document
                </Button>
              </Link>
              <Link to="/documents" className="flex-1">
                <Button variant="secondary" className="w-full">
                  View All Documents
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
            <Link to="/documents" className="text-sm text-purple-600 hover:text-purple-700">
              View all
            </Link>
          </div>

          {data?.recent_documents && data.recent_documents.length > 0 ? (
            <div className="grid gap-3">
              {data.recent_documents.map((doc: DocumentListItem) => {
                const status = statusConfig[doc.status];
                return (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center justify-between">
                      <Link to={`/documents/${doc.id}`} className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.title || 'Untitled Document'}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(doc.created_at).toLocaleDateString()} • {doc.image_count} images
                          </p>
                        </div>
                      </Link>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No documents yet</p>
                <Link to="/documents/new">
                  <Button>Create your first document</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
