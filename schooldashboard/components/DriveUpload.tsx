'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface UploadedFile {
  fileId: string;
  name: string;
  mimeType: string;
  size: string;
  viewLink: string;
  downloadLink: string;
  icon: string;
  parents: string[];
}

interface DriveUploadProps {
  onUploadComplete?: (file: UploadedFile) => void;
  parentFolderId?: string;
  acceptedTypes?: string;
  className?: string;
}

export default function DriveUpload({
  onUploadComplete,
  parentFolderId,
  acceptedTypes = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png',
  className
}: DriveUploadProps) {
  const [busy, setBusy] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (parentFolderId) {
        formData.append('parent_folder_id', parentFolderId);
      }

      const response = await fetch('/api/files/drive/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result: UploadedFile = await response.json();
      setUploadedFile(result);
      onUploadComplete?.(result);
      
      // Clear the input
      e.target.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Upload to Google Drive</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <input
            type="file"
            accept={acceptedTypes}
            disabled={busy}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={busy}
            className="w-full"
          >
            {busy ? 'Uploading...' : 'Choose File'}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {uploadedFile && (
          <div className="space-y-2 text-sm">
            <div className="text-green-600 bg-green-50 p-2 rounded">
              Upload successful!
            </div>
            <div className="space-y-1">
              <p><strong>Name:</strong> {uploadedFile.name}</p>
              <p><strong>Size:</strong> {uploadedFile.size} bytes</p>
              <div className="flex gap-2">
                <a
                  href={uploadedFile.viewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View
                </a>
                {uploadedFile.downloadLink && (
                  <a
                    href={uploadedFile.downloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}