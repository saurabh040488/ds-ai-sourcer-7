import React from 'react';
import { X, FileText, ExternalLink, Book, Code, Database, Zap, Users, Settings, Shield } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      id: 'overview',
      title: 'Application Overview',
      icon: Book,
      description: 'Complete overview of the AI Sourcing Tool and its capabilities',
      color: 'bg-blue-500'
    },
    {
      id: 'architecture',
      title: 'Architecture & Tech Stack',
      icon: Code,
      description: 'Technical architecture, technology choices, and system design',
      color: 'bg-purple-500'
    },
    {
      id: 'authentication',
      title: 'Authentication Flow',
      icon: Shield,
      description: 'User authentication, session management, and security',
      color: 'bg-green-500'
    },
    {
      id: 'features',
      title: 'Core Features',
      icon: Zap,
      description: 'Detailed breakdown of all application features and functionality',
      color: 'bg-orange-500'
    },
    {
      id: 'database',
      title: 'Database Schema',
      icon: Database,
      description: 'Complete database structure, relationships, and security policies',
      color: 'bg-indigo-500'
    },
    {
      id: 'ai-integration',
      title: 'AI Integration',
      icon: Zap,
      description: 'OpenAI integration, entity extraction, and AI-powered features',
      color: 'bg-pink-500'
    },
    {
      id: 'search',
      title: 'Search Algorithm',
      icon: Users,
      description: 'Three-stage search optimization and candidate matching logic',
      color: 'bg-cyan-500'
    },
    {
      id: 'campaigns',
      title: 'Campaign Management',
      icon: Settings,
      description: 'Email campaign creation, AI generation, and automation',
      color: 'bg-red-500'
    }
  ];

  const handleViewFullDocs = () => {
    // Open documentation in new tab
    window.open('/docs/README.md', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Application Documentation</h2>
              <p className="text-sm text-gray-600">Complete technical documentation and user guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Sourcing Tool Documentation</h3>
              <p className="text-gray-700 mb-4">
                Comprehensive documentation covering architecture, features, AI integration, database schema, 
                and development guidelines for the AI-powered healthcare recruitment platform.
              </p>
              <button
                onClick={handleViewFullDocs}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View Full Documentation
              </button>
            </div>
          </div>

          {/* Documentation Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => window.open(`/docs/README.md#${section.id}`, '_blank')}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 ${section.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {section.title}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Links */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-4">Quick Reference</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Code className="w-4 h-4" />
                </div>
                <h5 className="font-medium text-gray-900 text-sm">Tech Stack</h5>
                <p className="text-xs text-gray-600 mt-1">React, TypeScript, Supabase, OpenAI</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Database className="w-4 h-4" />
                </div>
                <h5 className="font-medium text-gray-900 text-sm">Database</h5>
                <p className="text-xs text-gray-600 mt-1">PostgreSQL with RLS</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-4 h-4" />
                </div>
                <h5 className="font-medium text-gray-900 text-sm">AI Features</h5>
                <p className="text-xs text-gray-600 mt-1">GPT-4 powered search & campaigns</p>
              </div>
            </div>
          </div>

          {/* Development Info */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h5 className="font-medium text-yellow-800 mb-1">Development Notes</h5>
                <p className="text-sm text-yellow-700">
                  This documentation is maintained alongside the codebase. For the latest updates and 
                  detailed technical information, refer to the full documentation link above.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleViewFullDocs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;