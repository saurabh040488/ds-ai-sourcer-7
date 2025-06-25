import React, { useState } from 'react';
import { Search, Bookmark, Sparkles, ChevronLeft, ChevronRight, LogOut, User, FileText, Briefcase, Building, Cpu, Bot } from 'lucide-react';
import { AuthContext } from './AuthWrapper';
import { Project } from '../lib/supabase';
import DocumentationModal from './DocumentationModal';
import AISettingsModal from './AISettingsModal';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  recentSearches: string[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isCreatingCampaign?: boolean;
  currentProject?: Project | null;
  onProjectChange?: (project: Project) => void;
  user?: any;
  onSignOut?: () => void;
  onRecentSearchClick?: (search: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  recentSearches,
  isCollapsed = false,
  onToggleCollapse,
  isCreatingCampaign = false,
  currentProject,
  user,
  onSignOut,
  onRecentSearchClick
}) => {
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);

  const menuItems = [
    { 
      id: 'search', 
      icon: Search, 
      label: 'Search', 
      badge: null,
      description: 'Find candidates with AI-powered search'
    },
    { 
      id: 'shortlist', 
      icon: Bookmark, 
      label: 'Shortlists', 
      badge: null,
      description: 'Manage saved candidate collections'
    },
    { 
      id: 'beta-campaigns', 
      icon: Bot, 
      label: 'Campaigns', 
      badge: 'AI',
      description: 'AI-powered campaign creation'
    },
    { 
      id: 'job-postings', 
      icon: Briefcase, 
      label: 'Job Postings', 
      badge: null,
      description: 'Manage job postings and requirements'
    },
    { 
      id: 'company-branding', 
      icon: Building, 
      label: 'Company Branding', 
      badge: null,
      description: 'Manage company profiles and collateral'
    }
  ];

  const handleSignOut = async () => {
    if (onSignOut) {
      console.log('🚪 Sidebar: User clicked sign out button');
      try {
        await onSignOut();
        console.log('✅ Sidebar: Sign out completed');
      } catch (error) {
        console.error('❌ Sidebar: Sign out failed:', error);
      }
    } else {
      console.warn('⚠️ Sidebar: No sign out handler provided');
    }
  };

  const handleRecentSearchClick = (search: string) => {
    if (onRecentSearchClick) {
      console.log('🔍 Sidebar: Recent search clicked:', search);
      // First switch to search view, then trigger the search
      onViewChange('search');
      // Small delay to ensure view has switched before triggering search
      setTimeout(() => {
        onRecentSearchClick(search);
      }, 100);
    }
  };

  const shouldCollapse = isCollapsed || isCreatingCampaign;

  return (
    <>
      <div className={`${shouldCollapse ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 ease-in-out relative flex-shrink-0`}>
        {/* Collapse Toggle Button - Hide when creating campaign */}
        {onToggleCollapse && !isCreatingCampaign && (
          <button
            onClick={onToggleCollapse}
            className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10 shadow-sm"
          >
            {shouldCollapse ? (
              <ChevronRight className="w-3 h-3 text-gray-600" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-gray-600" />
            )}
          </button>
        )}

        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!shouldCollapse && (
              <span className="font-semibold text-gray-900">Joveo AI</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isBeta = item.id === 'beta-campaigns';
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group mb-1 ${
                    isActive 
                      ? isBeta
                        ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 shadow-sm border border-purple-200'
                        : 'bg-purple-100 text-purple-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={shouldCollapse ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${
                    isActive 
                      ? isBeta 
                        ? 'text-purple-600' 
                        : 'text-purple-600'
                      : ''
                  }`} />
                  {!shouldCollapse && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isActive 
                            ? isBeta
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                              : 'bg-purple-200 text-purple-800'
                            : isBeta
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {shouldCollapse && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-gray-300 mt-1">{item.description}</div>
                      )}
                      {item.badge && (
                        <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                          isBeta 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                            : 'bg-gray-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Utility Links */}
          <div className="p-2 border-t border-gray-100 mt-4">
            {/* Documentation Link */}
            <button
              onClick={() => setShowDocumentation(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors relative group mb-1"
              title={shouldCollapse ? 'Documentation' : undefined}
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              {!shouldCollapse && (
                <span className="flex-1 text-left">Documentation</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {shouldCollapse && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  <div className="font-medium">Documentation</div>
                  <div className="text-gray-300 mt-1">View complete documentation</div>
                </div>
              )}
            </button>

            {/* AI Settings Link */}
            <button
              onClick={() => setShowAISettings(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors relative group"
              title={shouldCollapse ? 'AI Settings' : undefined}
            >
              <Cpu className="w-4 h-4 flex-shrink-0" />
              {!shouldCollapse && (
                <span className="flex-1 text-left">AI Settings</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {shouldCollapse && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  <div className="font-medium">AI Settings</div>
                  <div className="text-gray-300 mt-1">Configure AI models and prompts</div>
                </div>
              )}
            </button>
          </div>

          {/* Recent Searches */}
          {!shouldCollapse && recentSearches.length > 0 && (
            <div className="p-4 border-t border-gray-100 mt-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Recent Searches
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {recentSearches.slice(0, 8).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded transition-colors truncate group"
                    title={search}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3 h-3 text-gray-400 group-hover:text-purple-600 flex-shrink-0" />
                      <span className="truncate">{search}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          {!shouldCollapse ? (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {user?.full_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.company || 'Joveo'}
                  </p>
                </div>
              </div>
              
              {/* Project Info */}
              {currentProject && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                  <p className="font-medium text-gray-700 truncate">
                    {currentProject.name}
                  </p>
                  <p className="truncate">
                    {currentProject.industry} • {currentProject.status}
                  </p>
                </div>
              )}
              
              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center group relative">
                <User className="w-4 h-4 text-purple-600" />
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  <div className="font-medium">{user?.full_name || user?.email}</div>
                  <div className="text-gray-300 mt-1">{user?.company || 'Joveo'}</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1 text-gray-400 hover:text-gray-600 group relative"
              >
                <LogOut className="w-4 h-4" />
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  <div className="font-medium">Sign Out</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Documentation Modal */}
      <DocumentationModal 
        isOpen={showDocumentation}
        onClose={() => setShowDocumentation(false)}
      />

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
      />
    </>
  );
};

export default Sidebar;