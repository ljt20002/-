import React from 'react';
import { SettingsForm } from '../components/SettingsForm';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Settings: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <Link to="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-gray-800">设置</h1>
      </header>
      
      <main className="flex-1 p-4">
        <SettingsForm />
      </main>
    </div>
  );
};
