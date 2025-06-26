import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Zap, Sparkles, Loader2, ArrowLeft, Lightbulb, ChevronRight, X } from 'lucide-react';
import CandidateTable from './CandidateTable';
import FilterModal from './FilterModal';
import { SearchQuery, CandidateMatch, Candidate } from '../types';
import { extractEntities } from '../utils/searchUtils';
import { searchCandidatesWithStreaming } from '../utils/streamingSearch';
import { Project } from '../lib/supabase';

interface SearchViewProps {
  onSearch: (query: SearchQuery) => Promise<void>;
  matches: CandidateMatch[];
  isLoading: boolean;
  recentSearches: string[];
  candidates: Candidate[];
  currentProject?: Project | null;
}

const SearchView: React.FC<SearchViewProps> = ({
  onSearch,
  matches,
  isLoading,
  recentSearches,
  candidates,
  currentProject
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>(null);
  const [streamingMatches, setStreamingMatches] = useState<CandidateMatch[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [searchProgress, setSearchProgress] = useState<{
    stage: 'extraction' | 'filtering' | 'matching';
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const [showProTips, setShowProTips] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Pro tips for search
  const proTips = [
    "Target Experienced ICU Nurses with BSN",
    "New Graduates with Upcoming Licensure",
    "Licensed RNs with Flexible Education Levels",
    "Behavioral Health Nurses with 2-5 Years Experience",
    "Out-of-State Licensees with Doctoral Degrees",
    "Mid-Level Nurses with MSN in Progress",
    "ICU Specialists with Out-of-State Licenses",
    "New Graduates with Flexible Licensure Timelines",
    "Behavioral Health Experts with Doctoral Degrees",
    "Nurses with Other Masters and Recent Experience"
  ];

  useEffect(() => {
    // Reset streaming state when matches change from parent
    if (matches.length > 0 && isStreaming) {
      setIsStreaming(false);
      setStreamingMatches([]);
      setSearchProgress(null);
    }
  }, [matches]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isLoading) return;

    console.log('🔍 Starting search process for query:', searchQuery);
    setShowResults(true);
    setIsStreaming(true);
    setStreamingMatches([]);
    
    // Add extraction progress
    setSearchProgress({
      stage: 'extraction',
      current: 1,
      total: 3,
      message: 'Extracting entities from your query...'
    });

    try {
      console.log('🔍 Starting entity extraction...');
      const extractedEntities = await extractEntities(searchQuery);
      console.log('✅ Entity extraction complete:', extractedEntities);
      
      // Update progress to filtering stage
      setSearchProgress({
        stage: 'filtering',
        current: 2,
        total: 3,
        message: 'Filtering candidates based on criteria...'
      });
      
      // Store filters for potential later editing
      setFilters(extractedEntities.extractedEntities);
      
      // Start streaming search if we have candidates
      if (candidates && candidates.length > 0) {
        console.log('🔄 Starting streaming search with', candidates.length, 'candidates');
        
        // Update progress to matching stage
        setSearchProgress({
          stage: 'matching',
          current: 3,
          total: 3,
          message: 'Analyzing candidates with AI...'
        });
        
        // Use streaming search to get real-time updates
        await searchCandidatesWithStreaming(
          candidates,
          extractedEntities,
          (partialMatches) => {
            console.log('🔄 Streaming update:', partialMatches.length, 'matches');
            setStreamingMatches(partialMatches);
          }
        );
        
        // When streaming is done, trigger the regular search to save results
        await onSearch(extractedEntities);
      } else {
        // If no candidates, just do regular search
        await onSearch(extractedEntities);
      }
    } catch (error) {
      console.error('❌ Error in handleSearch:', error);
      setIsStreaming(false);
      setSearchProgress(null);
    }
  };

  const handleFilterSave = (newFilters: any) => {
    console.log('🔧 Filters updated:', newFilters);
    setFilters(newFilters);
    setShowFilters(false);
    
    // Reconstruct search query from filters
    const query: SearchQuery = {
      originalQuery: searchQuery,
      extractedEntities: newFilters
    };
    
    // Trigger search with updated filters
    onSearch(query);
  };

  const handleProTipClick = (tip: string) => {
    setSearchQuery(tip);
    // Focus the search input
    searchInputRef.current?.focus();
    // Optionally, automatically trigger search
    setTimeout(() => {
      handleSearch({ preventDefault: () => {} } as React.FormEvent);
    }, 100);
  };

  const displayedMatches = streamingMatches.length > 0 ? streamingMatches : matches;
  const isSearching = isLoading || isStreaming;

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Search className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI-Powered Search</h1>
              <p className="text-sm text-gray-600">
                Find the perfect candidates for {currentProject?.name || 'your project'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProTips(!showProTips)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showProTips 
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              {showProTips ? 'Hide Pro Tips' : 'Show Pro Tips'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Main Search Area */}
        <div className="flex-1 flex flex-col">
          {/* Search Form */}
          <div className="p-6 bg-white border-b border-gray-200">
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Describe the candidate you're looking for..."
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                    disabled={isSearching}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  
                  <button
                    type="submit"
                    disabled={!searchQuery.trim() || isSearching}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Search
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">
                    {recentSearches.length > 0 && (
                      <span>Recent searches: </span>
                    )}
                    {recentSearches.slice(0, 3).map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(search);
                          setTimeout(() => {
                            handleSearch({ preventDefault: () => {} } as React.FormEvent);
                          }, 100);
                        }}
                        className="text-purple-600 hover:text-purple-700 mr-1"
                      >
                        {search}{index < Math.min(recentSearches.length, 3) - 1 ? ', ' : ''}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-600">AI-powered search with natural language</span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Search Progress */}
          {searchProgress && (
            <div className="px-6 py-4 bg-white border-b border-gray-200">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span>{searchProgress.message}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        Step {searchProgress.current} of {searchProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(searchProgress.current / searchProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {showResults && (
            <div className="flex-1 flex flex-col">
              {displayedMatches.length > 0 ? (
                <CandidateTable 
                  matches={displayedMatches} 
                  onBack={() => setShowResults(false)}
                  onEditFilters={() => setShowFilters(true)}
                  currentFilters={filters}
                  currentProject={currentProject}
                />
              ) : isSearching ? (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Searching for candidates...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No candidates found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
                    <button
                      onClick={() => setShowFilters(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Filter className="w-4 h-4" />
                      Adjust Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Welcome Screen */}
          {!showResults && (
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
              <div className="text-center max-w-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Intelligent Candidate Search
                </h2>
                <p className="text-gray-600 mb-8">
                  Describe the candidates you're looking for in natural language. Our AI will understand your requirements and find the best matches.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <button 
                    onClick={() => handleProTipClick("Registered Nurse in New York specializing in pediatric care, with 5+ years of experience")}
                    className="p-4 text-left bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <Search className="w-4 h-4 text-purple-600" />
                      <span>Registered Nurse in New York specializing in pediatric care, with 5+ years of experience</span>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => handleProTipClick("Clinical Nurse Specialist in London focusing on oncology, holding a master's degree")}
                    className="p-4 text-left bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <Search className="w-4 h-4 text-purple-600" />
                      <span>Clinical Nurse Specialist in London focusing on oncology, holding a master's degree</span>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => handleProTipClick("Emergency Room Nurse in Los Angeles, bilingual in Spanish and English")}
                    className="p-4 text-left bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <Search className="w-4 h-4 text-purple-600" />
                      <span>Emergency Room Nurse in Los Angeles, bilingual in Spanish and English</span>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => handleProTipClick("Healthcare Administrator in Toronto with 10+ years managing clinics")}
                    className="p-4 text-left bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <Search className="w-4 h-4 text-purple-600" />
                      <span>Healthcare Administrator in Toronto with 10+ years managing clinics</span>
                    </div>
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  Try searching for specific skills, locations, experience levels, or education requirements
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pro Tips Panel */}
        {showProTips && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900">Pro Search Tips</h3>
              </div>
              <button 
                onClick={() => setShowProTips(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Try these powerful search queries to find specific candidates:
              </p>
              <div className="space-y-2">
                {proTips.map((tip, index) => (
                  <button
                    key={index}
                    onClick={() => handleProTipClick(tip)}
                    className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm text-gray-800 transition-colors flex items-center gap-2 group"
                  >
                    <span className="flex-1">{tip}</span>
                    <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700">
                  <strong>Tip:</strong> Be specific about experience levels, education requirements, and locations for the best results.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onSave={handleFilterSave}
      />
    </div>
  );
};

export default SearchView;