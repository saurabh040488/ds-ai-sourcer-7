import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, ChevronLeft, ChevronRight, Bookmark, MessageSquare, MoreHorizontal, CheckSquare, Square, Star, MapPin, Briefcase, Clock, Edit, TrendingUp, Zap, ChevronDown, ChevronUp, Plus, Users, Mail, X, Phone, Calendar, Award, Building } from 'lucide-react';
import { CandidateMatch, Candidate } from '../types';
import ShortlistModal from './ShortlistModal';
import CampaignSelectionModal from './CampaignSelectionModal';
import { Project } from '../lib/supabase';

interface CandidateTableProps {
  matches: CandidateMatch[];
  onBack: () => void;
  onEditFilters?: () => void;
  currentFilters?: any;
  currentProject?: Project | null;
}

const CandidateTable: React.FC<CandidateTableProps> = ({ 
  matches, 
  onBack, 
  onEditFilters, 
  currentFilters,
  currentProject 
}) => {
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [shortlistAction, setShortlistAction] = useState<'single' | 'bulk'>('single');
  const [campaignAction, setCampaignAction] = useState<'single' | 'bulk'>('bulk');
  const [selectedCandidateForShortlist, setSelectedCandidateForShortlist] = useState<string | null>(null);
  const [selectedCandidateForCampaign, setSelectedCandidateForCampaign] = useState<string | null>(null);
  const [selectedCandidateForDetail, setSelectedCandidateForDetail] = useState<Candidate | null>(null);
  const itemsPerPage = 15;
  
  const totalPages = Math.ceil(matches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMatches = matches.slice(startIndex, endIndex);

  // Add logging for currentFilters prop changes
  useEffect(() => {
    console.log('🔍 FILTER STATE DEBUG: CandidateTable received currentFilters prop:', currentFilters);
  }, [currentFilters]);

  const toggleSelection = (candidateId: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId);
    } else {
      newSelected.add(candidateId);
    }
    setSelectedCandidates(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCandidates.size === currentMatches.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(currentMatches.map(m => m.candidate.id)));
    }
  };

  const toggleExpanded = (candidateId: string) => {
    const newExpanded = new Set(expandedCandidates);
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId);
    } else {
      newExpanded.add(candidateId);
    }
    setExpandedCandidates(newExpanded);
  };

  const handleCandidateClick = (candidate: Candidate) => {
    console.log('Opening candidate detail panel for:', candidate.name);
    setSelectedCandidateForDetail(candidate);
  };

  const handleAddToShortlist = (candidateId: string) => {
    console.log('Adding candidate to shortlist:', candidateId);
    setSelectedCandidateForShortlist(candidateId);
    setShortlistAction('single');
    setShowShortlistModal(true);
  };

  const handleBulkAddToShortlist = () => {
    if (selectedCandidates.size === 0) return;
    console.log('Bulk adding candidates to shortlist:', Array.from(selectedCandidates));
    setShortlistAction('bulk');
    setShowShortlistModal(true);
  };

  const handleAddToCampaign = (candidateId: string) => {
    console.log('Adding candidate to campaign:', candidateId);
    setSelectedCandidateForCampaign(candidateId);
    setCampaignAction('single');
    setShowCampaignModal(true);
  };

  const handleCreateFirstCampaign = () => {
    if (selectedCandidates.size === 0) return;
    console.log('Creating first campaign for candidates:', Array.from(selectedCandidates));
    setCampaignAction('bulk');
    setShowCampaignModal(true);
  };

  const handleExport = () => {
    console.log('Exporting candidates:', selectedCandidates.size > 0 ? Array.from(selectedCandidates) : 'all');
    
    // Create CSV data
    const candidatesToExport = selectedCandidates.size > 0 
      ? matches.filter(m => selectedCandidates.has(m.candidate.id))
      : matches;
    
    const csvHeaders = ['Name', 'Job Title', 'Location', 'Experience', 'Skills', 'Email', 'Phone', 'Match Score', 'Category'];
    const csvData = candidatesToExport.map(match => [
      match.candidate.name,
      match.candidate.jobTitle,
      match.candidate.location,
      `${match.candidate.experience} years`,
      match.candidate.skills.join('; '),
      match.candidate.email,
      match.candidate.phone,
      `${match.explanation.score}%`,
      match.explanation.category
    ]);
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Export completed');
  };

  const getMatchBadge = (category: string, score: number) => {
    const badges = {
      excellent: { color: 'bg-green-100 text-green-800', text: 'Excellent' },
      good: { color: 'bg-blue-100 text-blue-800', text: 'Good' },
      potential: { color: 'bg-yellow-100 text-yellow-800', text: 'Potential' }
    };
    
    const validCategory = badges[category as keyof typeof badges] ? category : 'potential';
    const badge = badges[validCategory as keyof typeof badges];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text} ({score}%)
      </span>
    );
  };

  const getAvailabilityBadge = (availability: string) => {
    const badges = {
      available: { color: 'bg-green-100 text-green-800', text: 'Available' },
      passive: { color: 'bg-yellow-100 text-yellow-800', text: 'Passive' },
      'not-looking': { color: 'bg-red-100 text-red-800', text: 'Not Looking' }
    };
    
    const badge = badges[availability as keyof typeof badges];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  // Calculate match statistics
  const excellentMatches = matches.filter(m => m.explanation.category === 'excellent').length;
  const goodMatches = matches.filter(m => m.explanation.category === 'good').length;
  const potentialMatches = matches.filter(m => m.explanation.category === 'potential').length;
  const averageScore = matches.length > 0 ? Math.round(matches.reduce((sum, m) => sum + m.explanation.score, 0) / matches.length) : 0;

  // Display active filters
  const displayFilters = () => {
    if (!currentFilters) {
      console.log('🔍 FILTER STATE DEBUG: displayFilters called but currentFilters is null/undefined:', currentFilters);
      return null;
    }

    console.log('🔍 FILTER STATE DEBUG: displayFilters processing currentFilters:', currentFilters);

    const activeFilters = [];
    
    if (currentFilters.jobTitles?.length > 0) {
      const displayCount = Math.min(2, currentFilters.jobTitles.length);
      const remaining = currentFilters.jobTitles.length - displayCount;
      activeFilters.push({
        icon: Briefcase,
        label: currentFilters.jobTitles.slice(0, displayCount).join(', '),
        extra: remaining > 0 ? `+${remaining}` : null,
        expandable: remaining > 0,
        allItems: currentFilters.jobTitles
      });
    }

    if (currentFilters.locations?.length > 0) {
      const displayCount = Math.min(1, currentFilters.locations.length);
      const remaining = currentFilters.locations.length - displayCount;
      activeFilters.push({
        icon: MapPin,
        label: currentFilters.locations.slice(0, displayCount).join(', '),
        extra: remaining > 0 ? `+${remaining}` : null,
        expandable: remaining > 0,
        allItems: currentFilters.locations
      });
    }

    if (currentFilters.experienceRange?.min) {
      activeFilters.push({
        icon: Clock,
        label: `${currentFilters.experienceRange.min}+ years`,
        extra: null,
        expandable: false
      });
    }

    if (currentFilters.skills?.length > 0) {
      const displayCount = Math.min(1, currentFilters.skills.length);
      const remaining = currentFilters.skills.length - displayCount;
      activeFilters.push({
        icon: Star,
        label: currentFilters.skills.slice(0, displayCount).join(', '),
        extra: remaining > 0 ? `+${remaining}` : null,
        expandable: remaining > 0,
        allItems: currentFilters.skills
      });
    }

    console.log('🔍 FILTER STATE DEBUG: displayFilters created activeFilters:', activeFilters);
    return activeFilters;
  };

  const activeFilters = displayFilters();

  return (
    <div className="flex-1 flex bg-white">
      {/* Main Content */}
      <div className={`${selectedCandidateForDetail ? 'flex-1' : 'w-full'} flex flex-col`}>
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  AI-Matched Candidates ({matches.length.toLocaleString()})
                </h2>
                <p className="text-sm text-gray-600">Intelligent filtering + AI-powered relevance scoring</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Match Statistics */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">{excellentMatches} Excellent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">{goodMatches} Good</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">{potentialMatches} Potential</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-600">Avg: {averageScore}%</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{startIndex + 1} - {Math.min(endIndex, matches.length)} of {matches.length.toLocaleString()}</span>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar - Always show if filters exist or onEditFilters is available */}
        {(activeFilters && activeFilters.length > 0) || onEditFilters ? (
          <div className="border-b border-gray-200 px-6 py-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-wrap">
                {activeFilters && activeFilters.length > 0 ? (
                  activeFilters.map((filter, index) => {
                    const Icon = filter.icon;
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{filter.label}</span>
                        {filter.extra && filter.expandable && (
                          <button 
                            className="text-xs text-purple-600 font-medium hover:text-purple-700"
                            title={filter.allItems ? filter.allItems.join(', ') : ''}
                          >
                            {filter.extra}
                          </button>
                        )}
                        {filter.extra && !filter.expandable && (
                          <span className="text-xs text-purple-600 font-medium">{filter.extra}</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span>Search filters applied</span>
                  </div>
                )}
              </div>
              {onEditFilters && (
                <button 
                  onClick={() => {
                    console.log('🔍 FILTER STATE DEBUG: Edit Filters button clicked, currentFilters:', currentFilters);
                    onEditFilters();
                  }}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit Filters →
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="w-12 px-4 py-3">
                  <button onClick={toggleSelectAll}>
                    {selectedCandidates.size === currentMatches.length ? (
                      <CheckSquare className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Name & Title
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Location & Experience
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  AI Match Analysis
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="w-32 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentMatches.map((match) => {
                const { candidate, explanation } = match;
                const isSelected = selectedCandidates.has(candidate.id);
                const isExpanded = expandedCandidates.has(candidate.id);
                
                return (
                  <React.Fragment key={candidate.id}>
                    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-purple-50' : ''} cursor-pointer`}>
                      <td className="px-4 py-4">
                        <button onClick={() => toggleSelection(candidate.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                      
                      <td className="px-4 py-4" onClick={() => handleCandidateClick(candidate)}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-medium">
                              {candidate.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {candidate.name}
                            </h3>
                            <p className="text-sm text-purple-600 font-medium truncate">
                              {candidate.jobTitle}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {candidate.summary}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-4" onClick={() => handleCandidateClick(candidate)}>
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-900 mb-1">
                            <MapPin className="w-3 h-3" />
                            {candidate.location}
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-3 h-3" />
                            {candidate.experience} years experience
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {candidate.industry}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-4" onClick={() => handleCandidateClick(candidate)}>
                        <div className="space-y-2">
                          {getMatchBadge(explanation.category, explanation.score)}
                          <div className="text-xs text-gray-600">
                            <div className="flex items-start gap-1">
                              <Star className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{explanation.reasons[0]}</span>
                            </div>
                            {explanation.reasons.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpanded(candidate.id);
                                }}
                                className="text-xs text-purple-600 hover:text-purple-700 mt-1 flex items-center gap-1"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    +{explanation.reasons.length - 1} more reasons
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-4" onClick={() => handleCandidateClick(candidate)}>
                        <div className="space-y-2">
                          {getAvailabilityBadge(candidate.availability)}
                          <div className="text-xs text-gray-500">
                            Last active: {new Date(candidate.lastActive).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToShortlist(candidate.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                            title="Add to Shortlist"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCampaign(candidate.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                            title="Add to Campaign"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded reasons row */}
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="ml-16">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Complete Match Analysis:</h4>
                            <div className="space-y-1">
                              {explanation.reasons.map((reason, index) => (
                                <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                  <Star className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                  <span>{reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedCandidates.size} selected • AI-powered matching with {averageScore}% average relevance
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExport}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Export {selectedCandidates.size > 0 ? `(${selectedCandidates.size})` : 'All'}
              </button>
              
              {/* Juicebox-style action buttons */}
              {selectedCandidates.size > 0 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleBulkAddToShortlist}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Add to Shortlist ({selectedCandidates.size})
                  </button>
                  
                  <button 
                    onClick={handleCreateFirstCampaign}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Create 1st Campaign ({selectedCandidates.size})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Detail Panel */}
      {selectedCandidateForDetail && (
        <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
          {/* Detail Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Candidate Details</h3>
              <button
                onClick={() => setSelectedCandidateForDetail(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl font-medium">
                  {selectedCandidateForDetail.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-gray-900 mb-1">
                  {selectedCandidateForDetail.name}
                </h4>
                <p className="text-purple-600 font-medium mb-2">
                  {selectedCandidateForDetail.jobTitle}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedCandidateForDetail.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedCandidateForDetail.experience} years
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Contact Information */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Contact Information</h5>
              <div className="space-y-2">
                {selectedCandidateForDetail.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedCandidateForDetail.email}</span>
                  </div>
                )}
                {selectedCandidateForDetail.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedCandidateForDetail.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            {selectedCandidateForDetail.summary && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">Summary</h5>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedCandidateForDetail.summary}
                </p>
              </div>
            )}

            {/* Skills */}
            {selectedCandidateForDetail.skills && selectedCandidateForDetail.skills.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">Skills & Expertise</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidateForDetail.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {selectedCandidateForDetail.education && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">Education</h5>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedCandidateForDetail.education}</span>
                </div>
              </div>
            )}

            {/* Industry & Availability */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Professional Details</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedCandidateForDetail.industry}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    Last active: {new Date(selectedCandidateForDetail.lastActive).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-700">Status:</span>
                  {getAvailabilityBadge(selectedCandidateForDetail.availability)}
                </div>
              </div>
            </div>

            {/* Match Analysis */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">AI Match Analysis</h5>
              <div className="space-y-3">
                {(() => {
                  const match = matches.find(m => m.candidate.id === selectedCandidateForDetail.id);
                  if (!match) return null;
                  
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Match Score</span>
                        {getMatchBadge(match.explanation.category, match.explanation.score)}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 mb-2 block">Reasons:</span>
                        <div className="space-y-1">
                          {match.explanation.reasons.map((reason, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                              <Star className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Detail Actions */}
          <div className="p-6 border-t border-gray-200">
            <div className="space-y-3">
              <button
                onClick={() => handleAddToShortlist(selectedCandidateForDetail.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Bookmark className="w-4 h-4" />
                Add to Shortlist
              </button>
              <button
                onClick={() => handleAddToCampaign(selectedCandidateForDetail.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Add to Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortlist Modal */}
      {showShortlistModal && (
        <ShortlistModal
          isOpen={showShortlistModal}
          onClose={() => {
            setShowShortlistModal(false);
            setSelectedCandidateForShortlist(null);
          }}
          candidateIds={shortlistAction === 'single' && selectedCandidateForShortlist ? 
            [selectedCandidateForShortlist] : 
            Array.from(selectedCandidates)
          }
          onSuccess={() => {
            setShowShortlistModal(false);
            setSelectedCandidateForShortlist(null);
            if (shortlistAction === 'bulk') {
              setSelectedCandidates(new Set());
            }
          }}
          currentProject={currentProject}
        />
      )}

      {/* Campaign Selection Modal */}
      {showCampaignModal && (
        <CampaignSelectionModal
          isOpen={showCampaignModal}
          onClose={() => {
            setShowCampaignModal(false);
            setSelectedCandidateForCampaign(null);
          }}
          candidateIds={campaignAction === 'single' && selectedCandidateForCampaign ? 
            [selectedCandidateForCampaign] : 
            Array.from(selectedCandidates)
          }
          onSuccess={() => {
            setShowCampaignModal(false);
            setSelectedCandidateForCampaign(null);
            if (campaignAction === 'bulk') {
              setSelectedCandidates(new Set());
            }
          }}
          currentProject={currentProject}
        />
      )}
    </div>
  );
};

export default CandidateTable;