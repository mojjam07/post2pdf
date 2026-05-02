import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Download, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { documentApi } from '../services/api';

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const documentId = Number(id);
  const queryClient = useQueryClient();
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  const { data: document, isLoading, error } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => documentApi.get(documentId),
  });

  const generatePdfMutation = useMutation({
    mutationFn: () => documentApi.generatePdf(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentApi.delete(documentId),
    onSuccess: () => {
      window.location.href = '/dashboard';
    },
  });

  if (isLoading) {
    return (
      <MainLayout title="Document Details">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </MainLayout>
    );
  }

  if (error || !document) {
    return (
      <MainLayout title="Document Details">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-500">Failed to load document</p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
  };

  // Find selected image for preview modal
  const selectedImage = selectedImageId
    ? document.images.find(img => img.id === selectedImageId)
    : null;

  return (
    <MainLayout title="Document Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {document.title || 'Untitled Document'}
              </h1>
              <p className="text-gray-500">
                Created {new Date(document.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[document.status]}`}>
              {document.status}
            </span>

            {document.status === 'done' && document.pdf_file && (
              <Button onClick={() => window.open(document.pdf_file!, '_blank')}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            )}

            {document.status !== 'done' && (
              <Button
                onClick={() => generatePdfMutation.mutate()}
                isLoading={generatePdfMutation.isPending}
              >
                Generate PDF
              </Button>
            )}

            <Button
              variant="danger"
              onClick={() => {
                if (confirm('Are you sure you want to delete this document?')) {
                  deleteMutation.mutate();
                }
              }}
              isLoading={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

{/* Image Gallery */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Images ({document.images.length})
            </h2>
          </CardHeader>
          <CardContent>
            {document.images.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No images uploaded yet
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {document.images.map((image) => (
                  <div
                    key={image.id}
                    className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => setSelectedImageId(image.id)}
                  >
                    <img
                      src={image.image}
                      alt={`Image ${image.order + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Edit2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      #{image.order + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Preview Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedImageId(null)}
          >
            <div className="relative max-w-4xl w-full">
              <button
                onClick={() => setSelectedImageId(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                Close
              </button>
              <img
                src={selectedImage.image}
                alt={`Image ${selectedImage.order + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              <div className="text-center text-white mt-4">
                Image #{selectedImage.order + 1}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
