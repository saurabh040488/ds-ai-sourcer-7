import React, { useState, useContext, useEffect } from 'react';
import AuthWrapper, { AuthContext } from './components/AuthWrapper';
import Sidebar from './components/Sidebar';
import SearchView from './components/SearchView';
import BetaCampaignView from './components/beta/BetaCampaignView';
import ShortlistView from './components/ShortlistView';
import JobPostingsView from './components/JobPostingsView';
import CompanyBrandingView from './components/CompanyBrandingView';
import ProjectSelector from './components/ProjectSelector';
import { SearchQuery, CandidateMatch, Candidate } from './types';
import { Project, getCandidates, getRecentSearches, saveSearch, getSearchResults } from './lib/supabase';
import { seedCandidates } from './utils/candidateSeeder';
import { searchCandidates } from './utils/searchUtils';
import { convertDatabaseCandidatesToCandidates } from './utils/dataConverters';

function AppContent() {
  const { user, signOut } = useContext(AuthContext);
  const [currentView, setCurrentView] = useState('search');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [matches, setMatches] = useState<CandidateMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Load project data when project changes
  useEffect(() => {
    if (currentProject) {
      loadProjectData();
    }
  }, [currentProject]);

  const loadProjectData = async () => {
    if (!currentProject || !user) return;

    console.log('📊 Loading project data for:', currentProject.name);

    try {
      // Load candidates
      const { data: candidatesData, error: candidatesError } = await getCandidates(currentProject.id);
      
      if (candidatesError) {
        console.error('❌ Error loading candidates:', candidatesError);
        return;
      }

      console.log('👥 Loaded candidates:', candidatesData?.length || 0);
      
      // If no candidates, seed them
      if (!candidatesData || candidatesData.length === 0) {
        console.log('🌱 No candidates found, seeding database...');
        await seedCandidates(currentProject.id);
        
        // Reload candidates after seeding
        const { data: seededCandidates } = await getCandidates(currentProject.id);
        const convertedCandidates = convertDatabaseCandidatesToCandidates(seededCandidates || []);
        setCandidates(convertedCandidates);
        console.log('✅ Seeded and loaded', convertedCandidates.length, 'candidates');
      } else {
        // Convert database candidates to frontend format
        const convertedCandidates = convertDatabaseCandidatesToCandidates(candidatesData);
        setCandidates(convertedCandidates);
        console.log('✅ Converted and loaded', convertedCandidates.length, 'candidates');
      }

      // Load recent searches
      const { data: searchesData, error: searchesError } = await getRecentSearches(user.id, currentProject.id, 10);
      
      if (searchesError) {
        console.error('❌ Error loading recent searches:', searchesError);
      } else {
        const searchQueries = searchesData?.map(search => search.query) || [];
        setRecentSearches(searchQueries);
        console.log('🔍 Loaded recent searches:', searchQueries.length);
      }
    } catch (error) {
      console.error('❌ Error loading project data:', error);
    }
  };

  const handleSearch = async (query: SearchQuery) => {
    if (!currentProject || !user) {
      console.error('❌ Cannot search: Missing project or user');
      return;
    }

    if (!query || !query.originalQuery) {
      console.error('❌ Cannot search: Invalid query object', query);
      return;
    }

    console.log('🔍 Handling search:', query.originalQuery);
    setIsLoading(true);
    
    try {
      // Validate candidates array
      if (!candidates || !Array.isArray(candidates)) {
        console.error('❌ Cannot search: Invalid candidates array', candidates);
        setIsLoading(false);
        return;
      }

      console.log('📊 Searching through', candidates.length, 'candidates');
      
      // Search candidates using the existing search logic
      const searchResults = await searchCandidates(candidates, query);
      setMatches(searchResults);
      
      console.log('✅ Search completed:', searchResults.length, 'matches found');
      
      // Save search to database and update recent searches ONLY if results are found
      if (searchResults.length > 0) {
        const searchRecord = {
          user_id: user.id,
          project_id: currentProject.id,
          query: query.originalQuery,
          extracted_entities: query.extractedEntities || {},
          filters: {},
          results_count: searchResults.length,
          results: searchResults.map(match => ({
            candidate_id: match.candidate?.id || 'unknown',
            score: match.explanation?.score || 0,
            category: match.explanation?.category || 'potential',
            reasons: match.explanation?.reasons || []
          }))
        };
        
        const { error: saveError } = await saveSearch(searchRecord);
        if (saveError) {
          console.error('❌ Error saving search:', saveError);
        } else {
          console.log('✅ Search saved to database');
          // Update recent searches
          setRecentSearches(prev => {
            const filtered = prev.filter(s => s !== query.originalQuery);
            return [query.originalQuery, ...filtered].slice(0, 10);
          });
        }
      } else {
        console.log('⚠️ No candidates found, search not saved to database or recent searches.');
      }
    } catch (error) {
      console.error('❌ Error in handleSearch:', error);
      // Show user-friendly error
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecentSearchClick = async (searchQuery: string) => {
    if (!currentProject || !user) {
      console.error('❌ Cannot load recent search: Missing project or user');
      return;
    }

    console.log('🔍 Loading recent search:', searchQuery);

    try {
      // Try to load saved search results
      const { data: searchResults, error } = await getSearchResults(searchQuery, currentProject.id);
      
      if (error) {
        console.error('❌ Error loading search results:', error);
        return;
      }

      if (searchResults && searchResults.length > 0) {
        console.log('✅ Loaded saved search results:', searchResults.length);
        
        // Convert database candidates to frontend format
        const candidateMatches: CandidateMatch[] = searchResults.map((result: any) => {
          // Find the candidate in our current candidates array
          const candidate = candidates.find(c => c.id === result.candidate_id);
          if (!candidate) {
            console.warn('⚠️ Candidate not found for result:', result.candidate_id);
            return null;
          }
          
          return {
            candidate,
            explanation: {
              score: result.score || 0,
              category: result.category || 'potential',
              reasons: result.reasons || ['Saved search result']
            }
          };
        }).filter(Boolean);

        setMatches(candidateMatches);
        console.log('✅ Displaying saved search results');
      } else {
        console.log('🔄 No saved results found for this search');
      }
    } catch (error) {
      console.error('❌ Error handling recent search click:', error);
    }
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (view !== 'beta-campaigns') {
      setIsCreatingCampaign(false);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'search':
        return (
          <SearchView
            onSearch={handleSearch}
            matches={matches}
            isLoading={isLoading}
            recentSearches={recentSearches}
            candidates={candidates}
            currentProject={currentProject}
          />
        );
      case 'beta-campaigns':
        return (
          <BetaCampaignView 
            onCampaignCreationChange={setIsCreatingCampaign}
            currentProject={currentProject}
            recentSearches={recentSearches}
          />
        );
      case 'shortlist':
        return (
          <ShortlistView 
            currentProject={currentProject}
          />
        );
      case 'job-postings':
        return (
          <JobPostingsView 
            currentProject={currentProject}
          />
        );
      case 'company-branding':
        return (
          <CompanyBrandingView 
            currentProject={currentProject}
          />
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentView}</h2>
              <p className="text-gray-600">This section is coming soon</p>
              {currentProject && (
                <p className="text-sm text-gray-500 mt-2">Project: {currentProject.name}</p>
              )}
            </div>
          </div>
        );
    }
  };

  const shouldCollapseSidebar = isSidebarCollapsed || isCreatingCampaign;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        currentView={currentView} 
        onViewChange={handleViewChange}
        recentSearches={recentSearches}
        isCollapsed={shouldCollapseSidebar}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isCreatingCampaign={isCreatingCampaign}
        currentProject={currentProject}
        onProjectChange={setCurrentProject}
        user={user}
        onSignOut={signOut}
        onRecentSearchClick={handleRecentSearchClick}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Project Selector */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <ProjectSelector 
              currentProject={currentProject}
              onProjectChange={setCurrentProject}
            />
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{candidates.length.toLocaleString()} candidates</span>
              <span>•</span>
              <span>{user?.company || 'Joveo'}</span>
              <span>•</span>
              <span>{user?.full_name || user?.email}</span>
            </div>
          </div>
        </div>
        
        {renderCurrentView()}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthWrapper>
      <AppContent />
    </AuthWrapper>
  );
}

export default App;