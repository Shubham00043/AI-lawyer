'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { UploadDocument } from '@/components/UploadDocument';
import { ChatInterface } from '@/components/ChatInterface';
import { CaseList } from '@/components/CaseList';

export default function Home() {
  const { isSignedIn, user } = useUser();
  const [activeTab, setActiveTab] = useState('cases');

  return (
    <main className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Lawyer Assistant</h1>
        <p className="text-gray-600">Your intelligent legal document analysis and case management system</p>
      </header>

      {!isSignedIn ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Welcome to AI Lawyer Assistant</h2>
          <p className="mb-6">Please sign in to access the legal document analysis and case management system.</p>
          <button 
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
            onClick={() => window.location.href = '/sign-in'}
          >
            Sign In
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setActiveTab('cases')}
                  className={`px-4 py-2 text-left rounded-md ${
                    activeTab === 'cases' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                  }`}
                >
                  My Cases
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 text-left rounded-md ${
                    activeTab === 'upload' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                  }`}
                >
                  Upload Document
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 text-left rounded-md ${
                    activeTab === 'chat' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                  }`}
                >
                  Legal Assistant
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow">
            {activeTab === 'cases' && <CaseList />}
            {activeTab === 'upload' && <UploadDocument />}
            {activeTab === 'chat' && <ChatInterface />}
          </div>
        </div>
      )}
    </main>
  );
}
