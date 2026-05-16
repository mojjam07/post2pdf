import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Upload, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { documentApi } from '../services/api';

export function NewDocumentPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (uploadMethod === 'file' && files.length > 0) {
        return documentApi.uploadImages(files, title);
      } else if (uploadMethod === 'url' && sourceUrl) {
        return documentApi.fetchDocument(sourceUrl, title);
      }
      throw new Error('Invalid input');
    },
    onSuccess: (data) => {
      navigate(`/documents/${data.id}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

return (
    <MainLayout title="New Document">
      <div className="max-w-2xl mx-auto px-4 md:px-0">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Back to Dashboard</span>
        </Button>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <h2 className="text-lg text-gray-700 font-semibold">Create New Document</h2>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {/* Upload Method Tabs - Responsive */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant={uploadMethod === 'file' ? 'primary' : 'secondary'}
                  onClick={() => setUploadMethod('file')}
                  className="w-full sm:w-auto"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                </Button>
                <Button
                  type="button"
                  variant={uploadMethod === 'url' ? 'primary' : 'secondary'}
                  onClick={() => setUploadMethod('url')}
                  className="w-full sm:w-auto"
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  From URL
                </Button>
              </div>

              {/* Title */}
              <Input
                id="title"
                label="Document Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your document"
                className='text-gray-500'
              />

              {/* File Upload */}
              {uploadMethod === 'file' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Images
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {files.length > 0 ? (
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {files.length} file(s) selected
                        </p>
                        <p className="text-gray-500">
                          Click to change files
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          Click to upload images
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* URL Input */}
              {uploadMethod === 'url' && (
                <Input
                  id="source_url"
                  label="Source URL"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  type="url"
                  className=' text-gray-500'
                />
              )}

              {/* Error Display */}
              {uploadMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {(uploadMutation.error as Error).message}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                isLoading={uploadMutation.isPending}
                disabled={uploadMethod === 'file' ? files.length === 0 : !sourceUrl}
              >
                Create Document
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
}
