'use client';

import { useState } from 'react';

export function UploadDocument() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Uploading and processing document...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('Document uploaded and processed successfully!');
        setFile(null);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Error: ${error instanceof Error ? error.message : 'Failed to upload document'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Upload Legal Document</h2>
      <p className="text-gray-600">
        Upload a legal document (PDF, DOCX) to analyze its contents and extract key information.
      </p>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            id="document-upload"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <label
            htmlFor="document-upload"
            className="cursor-pointer flex flex-col items-center space-y-2"
          >
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600">
              {file ? file.name : 'Click to select a file or drag and drop'}
            </p>
            <p className="text-xs text-gray-500">PDF, DOCX (max. 10MB)</p>
          </label>
        </div>

        {file && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload & Analyze'}
            </button>
          </div>
        )}

        {uploadStatus && (
          <div className={`p-4 rounded-md ${
            uploadStatus.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {uploadStatus}
          </div>
        )}
      </form>
    </div>
  );
}
