import React, { useState, useEffect, useContext } from 'react';
import { X, Plus, Users, Bookmark, Loader2 } from 'lucide-react';
import { AuthContext } from './AuthWrapper';
import { getShortlists, createShortlist, addCandidateToShortlist, bulkAddCandidatesToShortlist, Project } from '../lib/supabase';

interface ShortlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateIds: string[];
  onSuccess: () => void;
  currentProject?: Project | null;
}

interface Shortlist {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  shortlist_candidates?: any[];
}

const ShortlistModal: React.FC<ShortlistModalProps> = ({
  isOpen,
  onClose,
  candidateIds,
  onSuccess,
  currentProject
}) => {
  const { user } = useContext(AuthContext);
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newShortlistName, setNewShortlistName] = useState('');
  const [newShortlistDescription, setNewShortlistDescription] = useState('');

  useEffect(() => {
    if (isOpen && user && currentProject) {
      loadShortlists();
    }
  }, [isOpen, user, currentProject]);

  const loadShortlists = async () => {
    if (!user || !currentProject) return;

    setLoading(true);
    try {
      const { data, error } = await getShortlists(user.id, currentProject.id);
      if (error) {
        console.error('❌ Error loading shortlists:', error);
      } else {
        setShortlists(data || []);
      }
    } catch (error) {
      console.error('❌ Error loading shortlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShortlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentProject || !newShortlistName.trim()) return;

    setCreating(true);
    try {
      const shortlistData = {
        user_id: user.id,
        project_id: currentProject.id,
        name: newShortlistName.trim(),
        description: newShortlistDescription.trim() || undefined
      };

      const { data: newShortlist, error } = await createShortlist(shortlistData);
      if (error) {
        console.error('❌ Error creating shortlist:', error);
        return;
      }

      // Add candidates to the new shortlist
      if (candidateIds.length === 1) {
        await addCandidateToShortlist(newShortlist.id, candidateIds[0]);
      } else {
        await bulkAddCandidatesToShortlist(newShortlist.id, candidateIds);
      }

      console.log('✅ Shortlist created and candidates added');
      onSuccess();
    } catch (error) {
      console.error('❌ Error creating shortlist:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleAddToExistingShortlist = async (shortlistId: string) => {
    if (!candidateIds.length) return;

    setAdding(true);
    try {
      if (candidateIds.length === 1) {
        const { error } = await addCandidateToShortlist(shortlistId, candidateIds[0]);
        if (error) {
          console.error('❌ Error adding candidate to shortlist:', error);
          return;
        }
      } else {
        const { error } = await bulkAddCandidatesToShortlist(shortlistId, candidateIds);
        if (error) {
          console.error('❌ Error bulk adding candidates to shortlist:', error);
          return;
        }
      }

      console.log('✅ Candidates added to shortlist');
      onSuccess();
    } catch (error) {
      console.error('❌ Error adding candidates to shortlist:', error);
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add to Shortlist</h2>
              <p className="text-sm text-gray-600">
                {candidateIds.length === 1 ? '1 candidate' : `${candidateIds.length} candidates`}
              </p>
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
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading shortlists...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Create New Shortlist */}
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Create New Shortlist</div>
                    <div className="text-sm text-gray-600">Start a new collection</div>
                  </div>
                </button>
              ) : (
                <form onSubmit={handleCreateShortlist} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shortlist Name
                    </label>
                    <input
                      type="text"
                      value={newShortlistName}
                      onChange={(e) => setNewShortlistName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Top Candidates for ICU Position"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newShortlistDescription}
                      onChange={(e) => setNewShortlistDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Brief description of this shortlist..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !newShortlistName.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create & Add'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Shortlists */}
              {shortlists.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Add to Existing Shortlist
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {shortlists.map((shortlist) => (
                      <button
                        key={shortlist.id}
                        onClick={() => handleAddToExistingShortlist(shortlist.id)}
                        disabled={adding}
                        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left disabled:opacity-50"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {shortlist.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {shortlist.shortlist_candidates?.length || 0} candidates • {new Date(shortlist.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        {adding && (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {shortlists.length === 0 && !showCreateForm && (
                <div className="text-center py-6">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No shortlists created yet</p>
                  <p className="text-sm text-gray-500">Create your first shortlist to organize candidates</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShortlistModal;