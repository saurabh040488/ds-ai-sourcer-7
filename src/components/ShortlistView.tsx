import React, { useState, useEffect, useContext } from 'react';
import { Bookmark, Users, Calendar, MapPin, Clock, Star, Mail, Phone, Plus, Trash2, Edit, Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { AuthContext } from './AuthWrapper';
import { Project, getShortlists, getCandidates } from '../lib/supabase';
import { convertDatabaseCandidatesToCandidates } from '../utils/dataConverters';
import { Candidate } from '../types';

interface ShortlistViewProps {
  currentProject?: Project | null;
}

interface ShortlistWithCandidates {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  candidates: Candidate[];
}

const ShortlistView: React.FC<ShortlistViewProps> = ({ currentProject }) => {
  const { user } = useContext(AuthContext);
  const [shortlists, setShortlists] = useState<ShortlistWithCandidates[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedShortlists, setExpandedShortlists] = useState<Set<string>>(new Set());
  const [selectedCandidateForDetail, setSelectedCandidateForDetail] = useState<Candidate | null>(null);

  useEffect(() => {
    if (user && currentProject) {
      loadShortlists();
    }
  }, [user, currentProject]);

  const loadShortlists = async () => {
    if (!user || !currentProject) return;

    console.log('📋 Loading shortlists for project:', currentProject.name);
    setLoading(true);

    try {
      // Get shortlists with candidate relationships
      const { data: shortlistsData, error: shortlistsError } = await getShortlists(user.id, currentProject.id);
      
      if (shortlistsError) {
        console.error('❌ Error loading shortlists:', shortlistsError);
        return;
      }

      // Get all candidates for the project
      const { data: candidatesData, error: candidatesError } = await getCandidates(currentProject.id);
      
      if (candidatesError) {
        console.error('❌ Error loading candidates:', candidatesError);
        return;
      }

      const allCandidates = convertDatabaseCandidatesToCandidates(candidatesData || []);

      // Process shortlists and match candidates
      const processedShortlists: ShortlistWithCandidates[] = (shortlistsData || []).map(shortlist => {
        const candidateIds = shortlist.shortlist_candidates?.map((sc: any) => sc.candidate_id) || [];
        const candidates = allCandidates.filter(candidate => candidateIds.includes(candidate.id));
        
        return {
          id: shortlist.id,
          name: shortlist.name,
          description: shortlist.description,
          created_at: shortlist.created_at,
          candidates
        };
      });

      setShortlists(processedShortlists);
      console.log('✅ Shortlists loaded:', processedShortlists.length);
    } catch (error) {
      console.error('❌ Error in loadShortlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleShortlistExpanded = (shortlistId: string) => {
    const newExpanded = new Set(expandedShortlists);
    if (newExpanded.has(shortlistId)) {
      newExpanded.delete(shortlistId);
    } else {
      newExpanded.add(shortlistId);
    }
    setExpandedShortlists(newExpanded);
  };

  const handleCandidateClick = (candidate: Candidate) => {
    console.log('Opening candidate detail for:', candidate.name);
    setSelectedCandidateForDetail(candidate);
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

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Project Selected</h3>
          <p className="text-gray-600">Please select a project to view shortlists.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shortlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-gray-50">
      {/* Main Content */}
      <div className={`${selectedCandidateForDetail ? 'flex-1' : 'w-full'} flex flex-col`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Bookmark className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Shortlists</h1>
                <p className="text-sm text-gray-600">
                  Manage your saved candidates for {currentProject.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {shortlists.length} shortlists • {shortlists.reduce((sum, s) => sum + s.candidates.length, 0)} total candidates
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {shortlists.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Bookmark className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  No Shortlists Yet
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Start building your talent pipeline by adding candidates to shortlists from your search results.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Search for candidates and use the "Add to Shortlist" button to create your first shortlist.
                  </p>
                </div>
              </div>
            ) : (
              /* Shortlists */
              <div className="space-y-6">
                {shortlists.map((shortlist) => {
                  const isExpanded = expandedShortlists.has(shortlist.id);
                  
                  return (
                    <div key={shortlist.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                      {/* Shortlist Header */}
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{shortlist.name}</h3>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                {shortlist.candidates.length} candidates
                              </span>
                            </div>
                            
                            {shortlist.description && (
                              <p className="text-gray-600 mb-3">{shortlist.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Created {new Date(shortlist.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {shortlist.candidates.length} candidates
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleShortlistExpanded(shortlist.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Candidates List */}
                      {isExpanded && (
                        <div className="p-6">
                          {shortlist.candidates.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-sm">No candidates in this shortlist yet</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {shortlist.candidates.map((candidate) => (
                                <div
                                  key={candidate.id}
                                  onClick={() => handleCandidateClick(candidate)}
                                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-white text-sm font-medium">
                                        {candidate.name.split(' ').map(n => n[0]).join('')}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-gray-900 truncate">
                                        {candidate.name}
                                      </h4>
                                      <p className="text-sm text-purple-600 font-medium truncate">
                                        {candidate.jobTitle}
                                      </p>
                                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        {candidate.location}
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        {candidate.experience} years
                                      </div>
                                      <div className="mt-2">
                                        {getAvailabilityBadge(candidate.availability)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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

            {/* Status */}
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Status</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Availability:</span>
                  {getAvailabilityBadge(selectedCandidateForDetail.availability)}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    Last active: {new Date(selectedCandidateForDetail.lastActive).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Actions */}
          <div className="p-6 border-t border-gray-200">
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Mail className="w-4 h-4" />
                Add to Sequence
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <Trash2 className="w-4 h-4" />
                Remove from Shortlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortlistView;