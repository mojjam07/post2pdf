import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Clock, Loader2, CheckCircle, Search, Filter } from 'lucide-react';

import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { documentApi } from '../services/api';
import type { DocumentListItem } from '../types';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  done: { label: 'Done', color: 'bg-green-100 text-green-700', icon: CheckCircle },
} as const;

type Status = 'pending' | 'processing' | 'done';

export function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status | ''>('');
  const [page, setPage] = useState(1);

  const filters = useMemo(() => {
    return {
      search: search.trim() ? search.trim() : undefined,
      status: status || undefined,
      // sort_by support exists in API; keep default server ordering
    };
  }, [search, status]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['documents', page, filters],
    queryFn: () => documentApi.list(filters, page),
  });

  const results = (data?.results || []) as DocumentListItem[];

  if (isLoading) {
    return (
      <MainLayout title="Documents">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Documents">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-500">Failed to load documents</p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Documents">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold text-gray-900">Browse documents</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                  <Input
                    value={search}
                    onChange={(e) => {
                      setPage(1);
                      setSearch(e.target.value);
                    }}
                    placeholder="Title..."
                    className="pl-9 text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={status}
                    onChange={(e) => {
                      setPage(1);
                      setStatus(e.target.value as Status | '');
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div className="flex md:justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setStatus('');
                    setPage(1);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {results.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No documents found</p>
                <p className="text-sm text-gray-400">Try adjusting search/filters.</p>
                <div className="mt-4">
                  <Link to="/documents/new">
                    <Button>Create new document</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            results.map((doc) => {
              const st = statusConfig[doc.status];
              return (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <Link to={`/documents/${doc.id}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {doc.title || 'Untitled Document'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(doc.created_at).toLocaleDateString()} • {doc.image_count} images
                            </p>
                          </div>
                        </div>
                      </Link>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.color}`}
                      >
                        <st.icon className="w-3 h-3" />
                        {st.label}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>

          <div className="text-sm text-gray-600">
            Page <span className="font-medium">{page}</span>
          </div>

          <Button
            variant="secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={!data?.next}
          >
            Next
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}

