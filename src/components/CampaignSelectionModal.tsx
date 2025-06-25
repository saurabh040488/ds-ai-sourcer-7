import React, { useState, useEffect, useContext } from 'react';
import { X, Plus, Mail, Users, Loader2, Sparkles } from 'lucide-react';
import { AuthContext } from './AuthWrapper';
import { getCampaigns, Project } from '../lib/supabase';

interface CampaignSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateIds: string[];
  onSuccess: () => void;
  currentProject?: Project | null;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  target_audience?: string;
  campaign_steps?: any[];
  created_at: string;
}

const CampaignSelectionModal: React.FC<CampaignSelectionModalProps> = ({
  isOpen,
  onClose,
  candidateIds,
  onSuccess,
  currentProject
}) => {
  const { user } = useContext(AuthContext);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen && user && currentProject) {
      loadCampaigns();
    }
  }, [isOpen, user, currentProject]);

  const loadCampaigns = async () => {
    if (!user || !currentProject) return;

    setLoading(true);
    try {
      const { data, error } = await getCampaigns(user.id, currentProject.id);
      if (error) {
        console.error('❌ Error loading campaigns:', error);
      } else {
        setCampaigns(data || []);
      }
    } catch (error) {
      console.error('❌ Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewCampaign = () => {
    console.log('🆕 Creating new campaign for candidates:', candidateIds);
    // TODO: Navigate to campaign creation with pre-selected candidates
    alert(`Creating new campaign for ${candidateIds.length} candidates - functionality will be implemented soon!`);
    onSuccess();
  };

  const handleAddToExistingCampaign = async (campaignId: string) => {
    if (!candidateIds.length) return;

    setAdding(true);
    try {
      console.log('📧 Adding candidates to campaign:', campaignId, candidateIds);
      // TODO: Implement adding candidates to existing campaign
      alert(`Adding ${candidateIds.length} candidates to campaign - functionality will be implemented soon!`);
      onSuccess();
    } catch (error) {
      console.error('❌ Error adding candidates to campaign:', error);
    } finally {
      setAdding(false);
    }
  };

  const getCampaignTypeColor = (type: string) => {
    const colors = {
      nurture: 'bg-blue-100 text-blue-800',
      enrichment: 'bg-green-100 text-green-800',
      'keep-warm': 'bg-orange-100 text-orange-800',
      reengage: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCampaignStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add to Campaign</h2>
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
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading campaigns...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Create New Campaign */}
              <button
                onClick={handleCreateNewCampaign}
                className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-gray-100 group-hover:bg-purple-100 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    Create New Campaign
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Start a new email sequence for these candidates
                  </div>
                </div>
              </button>

              {/* Existing Campaigns */}
              {campaigns.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Add to Existing Campaign
                  </h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {campaigns.map((campaign) => (
                      <button
                        key={campaign.id}
                        onClick={() => handleAddToExistingCampaign(campaign.id)}
                        disabled={adding}
                        className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left disabled:opacity-50"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {campaign.name}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCampaignStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCampaignTypeColor(campaign.type)}`}>
                              {campaign.type}
                            </span>
                            <span>{campaign.campaign_steps?.length || 0} steps</span>
                            <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                          </div>
                          
                          {campaign.target_audience && (
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {campaign.target_audience}
                            </p>
                          )}
                        </div>
                        {adding && (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {campaigns.length === 0 && (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No campaigns created yet</p>
                  <p className="text-sm text-gray-500">Create your first campaign to start engaging with candidates</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {candidateIds.length === 1 ? '1 candidate selected' : `${candidateIds.length} candidates selected`}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignSelectionModal;