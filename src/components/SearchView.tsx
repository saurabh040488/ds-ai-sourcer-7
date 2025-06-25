import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, User, Bot, Edit, Share, Plus, FileText, Code, Users, Upload, Loader2, Filter, Eye, Clock, Zap } from 'lucide-react';
import { SearchQuery, CandidateMatch, Candidate } from '../types';
import { extractEntities } from '../utils/searchUtils';
import { searchCandidatesWithStreaming } from '../utils/streamingSearch';
import CandidateTable from './CandidateTable';
import FilterModal from './FilterModal';
import { Project, getSearchResults } from '../lib/supabase';
import { convertDatabaseCandidatesToCandidates } from '../utils/dataConverters';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  extractedFilters?: any;
  searchQuery?: SearchQuery;
  isProcessing?: boolean;
  showSearchButton?: boolean;
  noResultsFound?: boolean;
  searchProgress?: {
    stage: string;
    current: number;
    total: number;
    message: string;
  };
}

interface SearchViewProps {
  onSearch: (query: SearchQuery) => void;
  matches: CandidateMatch[];
  isLoading: boolean;
  recentSearches?: string[];
  candidates: Candidate[];
  currentProject?: Project | null;
}

const SearchView: React.FC<SearchViewProps> = ({ 
  onSearch, 
  matches, 
  isLoading, 
  recentSearches = [],
  candidates,
  currentProject
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeSearchMethod, setActiveSearchMethod] = useState('natural');
  const [currentFilters, setCurrentFilters] = useState<any>(null);
  const [currentMatches, setCurrentMatches] = useState<CandidateMatch[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<SearchQuery | null>(null);
  const [recentSearchContext, setRecentSearchContext] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchMethods = [
    { 
      id: 'natural', 
      label: 'Natural Language', 
      icon: Sparkles, 
      placeholder: 'Describe the candidate you\'re looking for...'
    },
    { 
      id: 'jd', 
      label: 'Job Description', 
      icon: FileText, 
      placeholder: 'Paste job description here...'
    }
  ];

  // Update current matches when matches prop changes
  React.useEffect(() => {
    if (matches && matches.length > 0) {
      setCurrentMatches(matches);
      setShowResults(true);
    }
  }, [matches]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when not processing
  useEffect(() => {
    if (!isProcessing && !isSearching) {
      inputRef.current?.focus();
    }
  }, [isProcessing, isSearching]);

  // Add logging for currentFilters state changes
  useEffect(() => {
    console.log('🔍 FILTER STATE DEBUG: currentFilters state changed:', currentFilters);
  }, [currentFilters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    console.log('🚀 Starting search process for query:', inputValue);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    // Add processing message with animated progress
    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: 'Analyzing your query with AI to extract search criteria...',
      timestamp: new Date(),
      isProcessing: true,
      searchProgress: {
        stage: 'extraction',
        current: 1,
        total: 3,
        message: 'Extracting entities from your query...'
      }
    };
    setMessages(prev => [...prev, processingMessage]);

    try {
      console.log('🔍 Starting AI entity extraction...');
      
      // Extract entities using AI
      const searchQuery = await extractEntities(inputValue);
      setCurrentSearchQuery(searchQuery);
      
      console.log('✅ Entity extraction completed:', searchQuery);
      console.log('🔍 FILTER STATE DEBUG: About to create filters from searchQuery:', searchQuery);
      
      // Create filters display object
      const filters = {
        jobTitles: searchQuery.extractedEntities.jobTitles,
        locations: searchQuery.extractedEntities.locations,
        experienceRange: searchQuery.extractedEntities.experienceRange,
        skills: searchQuery.extractedEntities.skills,
        industries: searchQuery.extractedEntities.industries,
        education: searchQuery.extractedEntities.education
      };

      console.log('🔍 FILTER STATE DEBUG: Created filters object:', filters);
      setCurrentFilters(filters);
      console.log('🔍 FILTER STATE DEBUG: Called setCurrentFilters with:', filters);

      // Remove processing message and add filter extraction result
      setMessages(prev => prev.filter(msg => !msg.isProcessing));
      
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: `Perfect! I've analyzed your query and extracted the search criteria below. These filters will be applied to narrow down from our database of ${candidates.length.toLocaleString()} candidates.`,
        timestamp: new Date(),
        extractedFilters: filters,
        searchQuery: searchQuery,
        showSearchButton: true
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      console.log('✅ Filter extraction UI updated');
      
    } catch (error) {
      console.error('❌ Filter extraction error:', error);
      
      // Remove processing message and show error
      setMessages(prev => prev.filter(msg => !msg.isProcessing));
      
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while analyzing your query. Please try again or check your API key configuration.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setInputValue('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleSearchCandidates = async (searchQuery: SearchQuery) => {
    if (!searchQuery || isSearching) return;

    console.log('🔍 Starting streaming candidate search...');
    console.log('📊 Search parameters:', searchQuery);
    console.log('🔍 FILTER STATE DEBUG: currentFilters before search:', currentFilters);
    console.log('🔍 FILTER STATE DEBUG: currentSearchQuery before search:', currentSearchQuery);

    setIsSearching(true);
    setCurrentMatches([]);
    
    // Add searching message with progress tracking
    const searchingMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: 'Searching through candidates with intelligent filtering and AI-powered matching...',
      timestamp: new Date(),
      isProcessing: true,
      searchProgress: {
        stage: 'searching',
        current: 2,
        total: 3,
        message: 'Applying smart filters and AI analysis...'
      }
    };
    setMessages(prev => [...prev, searchingMessage]);

    try {
      console.log('🤖 Starting streaming search with real-time updates...');
      
      // Use streaming search for real-time results and capture the final result
      const finalMatches = await searchCandidatesWithStreaming(
        candidates, 
        searchQuery,
        (newMatches) => {
          console.log('📊 Received streaming update:', newMatches.length, 'total matches');
          setCurrentMatches(newMatches);
        }
      );

      console.log('✅ Streaming search completed with final matches:', finalMatches.length);
      console.log('🔍 FILTER STATE DEBUG: currentFilters after search completion:', currentFilters);
      console.log('🔍 FILTER STATE DEBUG: currentSearchQuery after search completion:', currentSearchQuery);

      // Remove searching message and add results based on FINAL matches count
      setMessages(prev => prev.filter(msg => !msg.isProcessing));
      
      let resultsMessage: Message;
      if (finalMatches.length === 0) {
        resultsMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `❌ No candidates found matching your search criteria.`,
          timestamp: new Date(),
          noResultsFound: true
        };
      } else {
        resultsMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `🎯 Search complete! Found ${finalMatches.length} candidates using intelligent filtering + AI analysis. Results are being displayed with real-time scoring.`,
          timestamp: new Date(),
          noResultsFound: false
        };
      }
      
      setMessages(prev => [...prev, resultsMessage]);
      
      // Call the parent onSearch for any additional handling
      onSearch(searchQuery);
      
    } catch (error) {
      console.error('❌ Search error:', error);
      
      // Remove searching message and show error
      setMessages(prev => prev.filter(msg => !msg.isProcessing));
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while searching candidates. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewResults = () => {
    console.log('👀 Viewing results for', currentMatches.length, 'candidates');
    console.log('🔍 FILTER STATE DEBUG: currentFilters when viewing results:', currentFilters);
    setShowResults(true);
  };

  const handleEditFilters = (filters: any) => {
    console.log('✏️ Editing filters:', filters);
    console.log('🔍 FILTER STATE DEBUG: handleEditFilters called with:', filters);
    setCurrentFilters(filters);
    
    // Update the search query with new filters
    if (currentSearchQuery) {
      const updatedQuery: SearchQuery = {
        ...currentSearchQuery,
        extractedEntities: {
          jobTitles: filters.jobTitles || [],
          locations: filters.locations || [],
          experienceRange: filters.experienceRange || {},
          skills: filters.skills || [],
          industries: filters.industries || [],
          education: filters.education
        }
      };
      setCurrentSearchQuery(updatedQuery);
      console.log('✅ Search query updated with new filters:', updatedQuery);
      console.log('🔍 FILTER STATE DEBUG: Updated currentSearchQuery:', updatedQuery);
    }
  };

  const handleRecentSearchClick = async (search: string) => {
    console.log('🔍 Clicked recent search:', search);
    console.log('🔍 FILTER STATE DEBUG: handleRecentSearchClick called for:', search);
    
    if (!currentProject) {
      console.error('❌ No current project selected');
      return;
    }

    try {
      // Try to load saved search results with extracted entities
      const { data: searchData, error, extracted_entities } = await getSearchResults(search, currentProject.id);
      
      if (error) {
        console.error('❌ Error loading search results:', error);
        // Fall back to new search
        setInputValue(search);
        return;
      }

      if (searchData && searchData.length > 0) {
        console.log('✅ Loaded saved search data:', searchData.length);
        console.log('🔍 FILTER STATE DEBUG: Retrieved extracted_entities:', extracted_entities);
        
        // Convert database candidates to frontend format
        const candidateMatches: CandidateMatch[] = searchData.map((result: any) => {
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

        setCurrentMatches(candidateMatches);
        setShowResults(true);
        setRecentSearchContext(search);
        
        // Extract filters from the saved search record
        if (extracted_entities) {
          console.log('🔍 Found saved extracted entities:', extracted_entities);
          console.log('🔍 FILTER STATE DEBUG: extracted_entities from database:', extracted_entities);
          
          const filters = {
            jobTitles: extracted_entities.jobTitles || [],
            locations: extracted_entities.locations || [],
            experienceRange: extracted_entities.experienceRange || {},
            skills: extracted_entities.skills || [],
            industries: extracted_entities.industries || [],
            education: extracted_entities.education
          };
          
          console.log('🔍 FILTER STATE DEBUG: Created filters from database entities:', filters);
          setCurrentFilters(filters);
          console.log('🔍 FILTER STATE DEBUG: Called setCurrentFilters with database filters:', filters);
          
          // Create search query object
          const searchQuery: SearchQuery = {
            originalQuery: search,
            extractedEntities: extracted_entities
          };
          setCurrentSearchQuery(searchQuery);
          console.log('🔍 FILTER STATE DEBUG: Set currentSearchQuery from database:', searchQuery);
          
          console.log('✅ Filters loaded from database:', filters);
        } else {
          console.log('⚠️ No extracted entities found in saved search, extracting from query...');
          console.log('🔍 FILTER STATE DEBUG: No extracted_entities in database, falling back to extraction');
          
          // Fallback: extract entities from the search string
          try {
            const searchQuery = await extractEntities(search);
            const filters = {
              jobTitles: searchQuery.extractedEntities.jobTitles || [],
              locations: searchQuery.extractedEntities.locations || [],
              experienceRange: searchQuery.extractedEntities.experienceRange || {},
              skills: searchQuery.extractedEntities.skills || [],
              industries: searchQuery.extractedEntities.industries || [],
              education: searchQuery.extractedEntities.education
            };
            console.log('🔍 FILTER STATE DEBUG: Extracted filters from query text:', filters);
            setCurrentFilters(filters);
            setCurrentSearchQuery(searchQuery);
            console.log('✅ Filters extracted from query text:', filters);
            console.log('🔍 FILTER STATE DEBUG: Set filters and searchQuery from extraction:', { filters, searchQuery });
          } catch (filterError) {
            console.warn('⚠️ Could not extract filters for recent search:', filterError);
            console.log('🔍 FILTER STATE DEBUG: Filter extraction failed, using basic filters');
            // Set basic empty filters
            const basicFilters = {
              jobTitles: [],
              locations: [],
              experienceRange: {},
              skills: [],
              industries: [],
              education: null
            };
            setCurrentFilters(basicFilters);
            
            const basicSearchQuery: SearchQuery = {
              originalQuery: search,
              extractedEntities: {
                jobTitles: [],
                locations: [],
                experienceRange: {},
                skills: [],
                industries: [],
                education: undefined
              }
            };
            setCurrentSearchQuery(basicSearchQuery);
            console.log('✅ Set basic filters for recent search');
            console.log('🔍 FILTER STATE DEBUG: Set basic filters and searchQuery:', { basicFilters, basicSearchQuery });
          }
        }
        
        // Clear any existing messages and show a simple message about loaded results
        setMessages([]);
        const loadedMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `📋 Loaded saved search results for "${search}" - ${candidateMatches.length} candidates found.`,
          timestamp: new Date()
        };
        setMessages([loadedMessage]);
        
        console.log('✅ Displaying saved search results');
        console.log('🔍 FILTER STATE DEBUG: Final state after recent search load - currentFilters:', currentFilters);
      } else {
        // No saved results, perform new search
        console.log('🔄 No saved results, performing new search');
        console.log('🔍 FILTER STATE DEBUG: No saved results found, falling back to new search');
        setInputValue(search);
        // Auto-submit the search
        setTimeout(() => {
          const form = document.querySelector('form');
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error handling recent search click:', error);
      console.log('🔍 FILTER STATE DEBUG: Error in handleRecentSearchClick:', error);
      // Fall back to new search
      setInputValue(search);
    }
  };

  // Expose the handleRecentSearchClick function to parent components
  React.useEffect(() => {
    // This effect will run when the component mounts or when dependencies change
    // We can use this to handle external recent search clicks
    const handleExternalRecentSearch = (event: CustomEvent) => {
      handleRecentSearchClick(event.detail.search);
    };

    window.addEventListener('recentSearchClick', handleExternalRecentSearch as EventListener);
    
    return () => {
      window.removeEventListener('recentSearchClick', handleExternalRecentSearch as EventListener);
    };
  }, [candidates, currentProject]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">AI Candidate Search</h1>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                {candidates.length.toLocaleString()} Candidates
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                Streaming Search
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                console.log('🔄 Starting new search session...');
                console.log('🔍 FILTER STATE DEBUG: New search button clicked, clearing all state');
                setMessages([]);
                setShowResults(false);
                setCurrentMatches([]);
                setCurrentFilters(null);
                setCurrentSearchQuery(null);
                setRecentSearchContext(null);
                console.log('🔍 FILTER STATE DEBUG: All state cleared for new search');
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              New Search
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {!showResults ? (
          /* Search Interface */
          <div className="flex-1 flex flex-col">
            {/* Search Method Buttons */}
            <div className="bg-white px-6 py-4 border-b border-gray-100">
              <div className="flex gap-2">
                {searchMethods.map((method) => {
                  const Icon = method.icon;
                  const isActive = activeSearchMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => {
                        console.log('🔄 Switching search method to:', method.label);
                        setActiveSearchMethod(method.id);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {method.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-8 bg-gray-50">
              <div className="max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                      Intelligent Candidate Search
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
                      {[
                        "Registered Nurse in New York specializing in pediatric care, with 5+ years of experience",
                        "Clinical Nurse Specialist in London focusing on oncology, holding a master's degree",
                        "Emergency Room Nurse in Los Angeles, bilingual in Spanish and English",
                        "Healthcare Administrator in Toronto with 10+ years managing clinics"
                      ].map((query, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            console.log('📝 Using example query:', query);
                            setInputValue(query);
                          }}
                          className="p-4 text-left bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-sm transition-all duration-200 group"
                        >
                          <div className="flex items-start gap-3">
                            <Search className="w-5 h-5 text-purple-600 mt-0.5 group-hover:scale-110 transition-transform" />
                            <span className="text-sm text-gray-700 group-hover:text-gray-900">
                              {query}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div key={message.id} className="flex gap-4">
                        <div className="flex-shrink-0">
                          {message.type === 'user' ? (
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">U</span>
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                              {message.isProcessing ? (
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                              ) : (
                                <Sparkles className="w-5 h-5 text-white" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <p className="text-gray-800">{message.content}</p>
                            
                            {/* Progress indicator for processing messages */}
                            {message.isProcessing && message.searchProgress && (
                              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3 mb-2">
                                  <Clock className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-gray-900">
                                    Step {message.searchProgress.current} of {message.searchProgress.total}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(message.searchProgress.current / message.searchProgress.total) * 100}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-600">{message.searchProgress.message}</p>
                              </div>
                            )}
                            
                            {/* No Results Found UI */}
                            {message.type === 'assistant' && message.noResultsFound && (
                              <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                                <Users className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                <h4 className="text-xl font-semibold text-red-800 mb-2">No Candidates Found</h4>
                                <p className="text-red-700 mb-6">
                                  Your current search criteria did not yield any matches in our database.
                                  Please try adjusting your filters or broadening your search.
                                </p>
                                <div className="flex justify-center gap-4">
                                  <button
                                    onClick={() => {
                                      console.log('✏️ Opening filter editor from no results message...');
                                      setShowFilterModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Adjust Filters
                                  </button>
                                  <button
                                    onClick={() => {
                                      console.log('🔄 Starting new search session from no results message...');
                                      setMessages([]);
                                      setShowResults(false);
                                      setCurrentMatches([]);
                                      setCurrentFilters(null);
                                      setCurrentSearchQuery(null);
                                      setRecentSearchContext(null);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Start New Search
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {message.type === 'assistant' && message.extractedFilters && !message.isProcessing && !message.noResultsFound && (
                              <div className="mt-6">
                                {/* Extracted Filters Display */}
                                <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-purple-600" />
                                    AI-Extracted Search Criteria
                                    <span className="ml-auto text-xs text-gray-500">Ready for search</span>
                                  </h4>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {message.extractedFilters.jobTitles?.length > 0 && (
                                      <div>
                                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Job Titles</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {message.extractedFilters.jobTitles.slice(0, 3).map((title: string, index: number) => (
                                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                                              {title}
                                            </span>
                                          ))}
                                          {message.extractedFilters.jobTitles.length > 3 && (
                                            <span 
                                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs cursor-pointer hover:bg-gray-200"
                                              title={message.extractedFilters.jobTitles.slice(3).join(', ')}
                                            >
                                              +{message.extractedFilters.jobTitles.length - 3} more
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {message.extractedFilters.locations?.length > 0 && (
                                      <div>
                                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Locations</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {message.extractedFilters.locations.map((location: string, index: number) => (
                                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                                              {location}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {message.extractedFilters.experienceRange?.min && (
                                      <div>
                                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Experience</span>
                                        <div className="mt-1">
                                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-medium">
                                            {message.extractedFilters.experienceRange.min}+ years
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {message.extractedFilters.skills?.length > 0 && (
                                      <div>
                                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Skills</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {message.extractedFilters.skills.slice(0, 3).map((skill: string, index: number) => (
                                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium">
                                              {skill}
                                            </span>
                                          ))}
                                          {message.extractedFilters.skills.length > 3 && (
                                            <span 
                                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs cursor-pointer hover:bg-gray-200"
                                              title={message.extractedFilters.skills.slice(3).join(', ')}
                                            >
                                              +{message.extractedFilters.skills.length - 3} more
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {message.extractedFilters.industries?.length > 0 && (
                                      <div>
                                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Industries</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {message.extractedFilters.industries.map((industry: string, index: number) => (
                                            <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-xs font-medium">
                                              {industry}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {message.extractedFilters.education && (
                                      <div>
                                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Education</span>
                                        <div className="mt-1">
                                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs font-medium">
                                            {message.extractedFilters.education}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {message.showSearchButton && (
                                  <div className="flex gap-3">
                                    <button 
                                      onClick={() => {
                                        console.log('✏️ Opening filter editor...');
                                        setShowFilterModal(true);
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit Filters
                                    </button>
                                    <button 
                                      onClick={() => {
                                        console.log('🚀 Starting streaming candidate search...');
                                        handleSearchCandidates(message.searchQuery!);
                                      }}
                                      disabled={isSearching}
                                      className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors"
                                    >
                                      {isSearching ? (
                                        <>
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          Searching...
                                        </>
                                      ) : (
                                        <>
                                          <Search className="w-4 h-4" />
                                          Search Candidates
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Show results button after search is complete */}
                            {message.type === 'assistant' && !message.isProcessing && !message.showSearchButton && !message.noResultsFound && currentMatches.length > 0 && (
                              <div className="mt-4">
                                <button 
                                  onClick={handleViewResults}
                                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  View {currentMatches.length} Results
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="relative">
                  {activeSearchMethod === 'jd' ? (
                    <div className="space-y-3">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Paste your job description here and I'll extract the key requirements..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500 resize-none"
                        rows={4}
                      />
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          <Upload className="w-4 h-4" />
                          Upload File
                        </button>
                        <button
                          type="submit"
                          disabled={!inputValue.trim() || isProcessing}
                          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                        >
                          {isProcessing ? 'Analyzing...' : 'Extract Requirements'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={searchMethods.find(m => m.id === activeSearchMethod)?.placeholder}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                        disabled={isProcessing}
                      />
                      <button
                        type="submit"
                        disabled={!inputValue.trim() || isProcessing}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Search className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )}
                </form>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  <strong>Streaming Search:</strong> Real-time results with AI analysis
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Results View */
          <CandidateTable 
            matches={currentMatches} 
            onBack={() => setShowResults(false)}
            onEditFilters={() => setShowFilterModal(true)}
            currentFilters={currentFilters}
            currentProject={currentProject}
          />
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <FilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          filters={currentFilters || {
            jobTitles: [],
            locations: [],
            experienceRange: {},
            skills: [],
            industries: [],
            education: null
          }}
          onSave={(filters) => {
            handleEditFilters(filters);
            setShowFilterModal(false);
          }}
        />
      )}
    </div>
  );
};

export default SearchView;