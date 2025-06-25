import React, { useState, useEffect, useContext } from 'react';
import { Plus, Mail, Users, Target, MessageSquare, Clock, Sparkles, ArrowLeft, Send, Eye, BarChart3, Copy, Edit, Play, Pause, Trash2, Bot, Zap } from 'lucide-react';
import CampaignSetup from '../CampaignSetup';
import CampaignStepsEditor from '../CampaignStepsEditor';
import CampaignAssistant from './CampaignAssistant';
import { AuthContext } from '../AuthWrapper';
import { Project, getCampaigns, Campaign as DatabaseCampaign, CampaignStep, deleteCampaign } from '../../lib/supabase';
import { type EmailStep } from '../../utils/openai';
import ConfirmationModal from '../ConfirmationModal';

interface Campaign extends DatabaseCampaign {
  campaign_steps?: CampaignStep[];
}

interface BetaCampaignViewProps {
  onCampaignCreationChange?: (isCreating: boolean) => void;
  currentProject?: Project | null;
  recentSearches?: string[];
}

type ViewState = 'list' | 'setup' | 'steps' | 'assistant';

const BetaCampaignView: React.FC<BetaCampaignViewProps> = ({ 
  onCampaignCreationChange, 
  currentProject,
  recentSearches = []
}) => {
  const { user } = useContext(AuthContext);
  const [viewState, setViewState] = useState<ViewState>('list');
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExistingCampaigns, setShowExistingCampaigns] = useState(false);
  
  // Campaign creation state
  const [campaignData, setCampaignData] = useState<any>(null);
  const [emailSteps, setEmailSteps] = useState<EmailStep[]>([]);

  // Delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [campaignToDeleteId, setCampaignToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user && currentProject) {
      loadCampaigns();
    }
  }, [user, currentProject]);

  // Update parent about creation state
  useEffect(() => {
    onCampaignCreationChange?.(viewState !== 'list');
  }, [viewState, onCampaignCreationChange]);

  const loadCampaigns = async () => {
    if (!user || !currentProject) return;

    console.log('📧 Loading campaigns for project:', currentProject.name);
    setLoading(true);

    try {
      const { data, error } = await getCampaigns(user.id, currentProject.id);
      
      if (error) {
        console.error('❌ Error loading campaigns:', error);
        return;
      }

      console.log('✅ Campaigns loaded:', data?.length || 0);
      setCampaigns(data || []);
    } catch (error) {
      console.error('❌ Error in loadCampaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const campaignTemplates = [
    {
      id: 'nurture',
      name: 'Nurture Campaign',
      steps: 4,
      days: 8,
      description: 'Email sequence designed for healthcare professionals.',
      icon: MessageSquare,
      color: 'bg-blue-500'
    },
    {
      id: 'enrichment',
      name: 'Enrichment Campaign', 
      steps: 3,
      days: 6,
      description: 'Provide valuable industry insights and content.',
      icon: Target,
      color: 'bg-green-500'
    },
    {
      id: 'keep-warm',
      name: 'Keep Warm',
      steps: 2,
      days: 4,
      description: 'Quick, focused outreach with room for personalization.',
      icon: Clock,
      color: 'bg-orange-500'
    },
    {
      id: 'reengage',
      name: 'Reengage Campaign',
      steps: 3,
      days: 5,
      description: 'Reconnect with contacts who didn\'t respond initially.',
      icon: Users,
      color: 'bg-purple-500'
    }
  ];

  const handleStartCreation = () => {
    setEditingCampaign(null);
    setCampaignData(null);
    setEmailSteps([]);
    setViewState('setup');
  };

  const handleStartAssistant = () => {
    setEditingCampaign(null);
    setCampaignData(null);
    setEmailSteps([]);
    setViewState('assistant');
  };

  const handleUseExistingCampaign = (campaign: Campaign) => {
    console.log('📧 Using existing campaign as template:', campaign.name);
    
    // Convert campaign to setup format
    const setupData = {
      name: `${campaign.name} (Copy)`,
      type: campaign.type,
      targetAudience: campaign.target_audience || '',
      campaignGoal: campaign.campaign_goal || '',
      contentSources: campaign.content_sources || [],
      aiInstructions: campaign.ai_instructions || '',
      tone: campaign.tone || 'professional',
      companyName: campaign.company_name || 'HCA Healthcare',
      recruiterName: campaign.recruiter_name || 'Sarah Johnson'
    };
    
    // Convert steps to EmailStep format
    const steps: EmailStep[] = (campaign.campaign_steps || []).map((step, index) => ({
      id: `step-${index + 1}`,
      type: step.type || 'email',
      subject: step.subject || '',
      content: step.content || '',
      delay: step.delay || 0,
      delayUnit: step.delay_unit || 'immediately'
    }));
    
    setCampaignData(setupData);
    setEmailSteps(steps);
    setViewState('steps'); // Go directly to steps editor
  };

  const handleProceedToSteps = (data: any, steps: EmailStep[]) => {
    console.log('📧 Proceeding to steps editor with:', { data, stepsCount: steps.length });
    setCampaignData(data);
    setEmailSteps(steps);
    setViewState('steps');
  };

  const handleAssistantCampaignCreated = (data: any, steps: EmailStep[]) => {
    console.log('🤖 AI Assistant created campaign:', { data, stepsCount: steps.length });
    setCampaignData(data);
    setEmailSteps(steps);
    setViewState('steps');
  };

  const handleBackToSetup = () => {
    setViewState('setup');
  };

  const handleBackToList = () => {
    setViewState('list');
    setEditingCampaign(null);
    setCampaignData(null);
    setEmailSteps([]);
  };

  const handleSaveCampaign = async (savedCampaign: any) => {
    console.log('💾 Campaign saved:', savedCampaign);
    
    // Reload campaigns after creation/update
    await loadCampaigns();
    
    // Return to list view
    handleBackToList();
  };

  const handleEditCampaign = (campaign: Campaign) => {
    console.log('✏️ Editing campaign:', campaign.name);
    setEditingCampaign(campaign);
    
    // Convert campaign to setup format
    const setupData = {
      name: campaign.name,
      type: campaign.type,
      targetAudience: campaign.target_audience || '',
      campaignGoal: campaign.campaign_goal || '',
      contentSources: campaign.content_sources || [],
      aiInstructions: campaign.ai_instructions || '',
      tone: campaign.tone || 'professional',
      companyName: campaign.company_name || 'HCA Healthcare',
      recruiterName: campaign.recruiter_name || 'Sarah Johnson'
    };
    
    // Convert steps to EmailStep format
    const steps: EmailStep[] = (campaign.campaign_steps || []).map((step, index) => ({
      id: step.id || `step-${index + 1}`,
      type: step.type || 'email',
      subject: step.subject || '',
      content: step.content || '',
      delay: step.delay || 0,
      delayUnit: step.delay_unit || 'immediately'
    }));
    
    setCampaignData(setupData);
    setEmailSteps(steps);
    setViewState('steps'); // Go directly to steps editor for editing
  };

  const handleCloneCampaign = (campaign: Campaign) => {
    console.log('📋 Cloning campaign:', campaign.name);
    handleUseExistingCampaign(campaign);
  };

  const handleToggleCampaignStatus = (campaignId: string) => {
    console.log('⏯️ Toggling campaign status:', campaignId);
    // TODO: Implement campaign status toggle
  };

  const handleDeleteCampaign = (campaignId: string) => {
    console.log('🗑️ Preparing to delete campaign:', campaignId);
    setCampaignToDeleteId(campaignId);
    setShowDeleteConfirmation(true);
    console.log('🔍 DEBUG: showDeleteConfirmation set to true, current value:', showDeleteConfirmation);
    console.log('🔍 DEBUG: campaignToDeleteId set to:', campaignId);
  };

  const confirmDeleteCampaign = async () => {
    if (!campaignToDeleteId) return;
    
    console.log('🗑️ Confirming deletion of campaign:', campaignToDeleteId);
    setIsDeleting(true);
    
    try {
      const { error } = await deleteCampaign(campaignToDeleteId);
      
      if (error) {
        console.error('❌ Error deleting campaign:', error);
        alert(`Failed to delete campaign: ${error.message}`);
      } else {
        console.log('✅ Campaign deleted successfully');
        // Remove the campaign from the local state
        setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignToDeleteId));
      }
    } catch (error) {
      console.error('❌ Exception in confirmDeleteCampaign:', error);
      alert('An unexpected error occurred while deleting the campaign');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      setCampaignToDeleteId(null);
    }
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Mail className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Project Selected</h3>
          <p className="text-gray-600">Please select a project to view campaigns.</p>
        </div>
      </div>
    );
  }

  // Render based on view state
  switch (viewState) {
    case 'setup':
      return (
        <CampaignSetup
          onBack={handleBackToList}
          onProceedToSteps={handleProceedToSteps}
          campaignTemplates={campaignTemplates}
          currentProject={currentProject}
        />
      );
      
    case 'steps':
      return (
        <CampaignStepsEditor
          onBack={editingCampaign ? handleBackToList : handleBackToSetup}
          onSave={handleSaveCampaign}
          campaignData={campaignData}
          emailSteps={emailSteps}
          editingCampaign={editingCampaign}
          currentProject={currentProject}
        />
      );

    case 'assistant':
      return (
        <CampaignAssistant
          onBack={handleBackToList}
          onCampaignCreated={handleAssistantCampaignCreated}
          currentProject={currentProject}
          recentSearches={recentSearches}
        />
      );
      
    default: // 'list'
      if (loading) {
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading campaigns...</p>
            </div>
          </div>
        );
      }

      return (
        <>
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-semibold text-gray-900">Beta Campaigns</h1>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        Beta
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Create and manage email sequences for {currentProject.name} with AI assistance
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {campaigns.length > 0 && (
                    <button
                      onClick={() => setShowExistingCampaigns(!showExistingCampaigns)}
                      className="flex items-center gap-2 px-4 py-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                    >
                      <Copy className="w-4 h-4" />
                      Use Existing ({campaigns.length})
                    </button>
                  )}
                  <button
                    onClick={handleStartAssistant}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium shadow-lg"
                  >
                    <Bot className="w-4 h-4" />
                    AI Assistant
                  </button>
                  <button
                    onClick={handleStartCreation}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Manual Creation
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto">
                {/* AI Assistant Promotion */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Try the New AI Campaign Assistant
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Let our AI guide you through creating the perfect campaign. Just describe your goal, 
                        and we'll match you with proven templates and generate personalized email sequences.
                      </p>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handleStartAssistant}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium shadow-lg"
                        >
                          <Bot className="w-5 h-5" />
                          Start AI Assistant
                        </button>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span>AI-powered suggestions</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span>Proven templates</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4 text-green-600" />
                            <span>Instant generation</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Existing Campaigns Selector */}
                {showExistingCampaigns && campaigns.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Use Existing Campaign as Template</h3>
                        <button
                          onClick={() => setShowExistingCampaigns(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <span className="sr-only">Close</span>
                          ×
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Select a campaign to use as a starting point</p>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {campaigns.map((campaign) => (
                          <button
                            key={campaign.id}
                            onClick={() => handleUseExistingCampaign(campaign)}
                            className="p-4 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all duration-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900 truncate">{campaign.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                                campaign.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {campaign.status}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-3">
                              {campaign.campaign_steps?.length || 0} steps • {campaign.type} campaign
                            </div>
                            
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {campaign.target_audience || 'No target audience specified'}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing Campaigns List */}
                {campaigns.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Your Campaigns</h3>
                        <span className="text-sm text-gray-600">{campaigns.length} campaigns</span>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                      {campaigns.map((campaign) => (
                        <div key={campaign.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                                  campaign.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                  campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                </span>
                                {campaign.job_posting_id && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                    Job Linked
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-6 text-sm text-gray-600 mb-2">
                                <span>{campaign.campaign_steps?.length || 0} steps • {campaign.type} campaign</span>
                                {campaign.stats && (
                                  <>
                                    <div className="flex items-center gap-1">
                                      <Eye className="w-4 h-4" />
                                      <span>{campaign.stats.opened || 0} opened</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <BarChart3 className="w-4 h-4" />
                                      <span>{campaign.stats.replied || 0} replied</span>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600">
                                {campaign.target_audience || 'No target audience specified'}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleEditCampaign(campaign)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Campaign"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleCloneCampaign(campaign)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Clone Campaign"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleCampaignStatus(campaign.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  campaign.status === 'active' 
                                    ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50' 
                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                }`}
                                title={campaign.status === 'active' ? 'Pause Campaign' : 'Activate Campaign'}
                              >
                                {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                              <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteCampaign(campaign.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Campaign"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {campaigns.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Create Your First Campaign with AI
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Try our new AI Campaign Assistant to create personalized email sequences 
                      based on proven templates and your specific goals.
                    </p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={handleStartAssistant}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium shadow-lg"
                      >
                        <Bot className="w-5 h-5" />
                        Try AI Assistant
                      </button>
                      <button
                        onClick={handleStartCreation}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        <Plus className="w-5 h-5" />
                        Manual Creation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          <ConfirmationModal
            isOpen={showDeleteConfirmation}
            onClose={() => {
              console.log('🔍 DEBUG: Closing delete confirmation modal');
              setShowDeleteConfirmation(false);
              setCampaignToDeleteId(null);
            }}
            onConfirm={confirmDeleteCampaign}
            title="Delete Campaign"
            message="Are you sure you want to delete this campaign? This action cannot be undone."
            confirmText={isDeleting ? "Deleting..." : "Delete Campaign"}
            cancelText="Cancel"
            confirmVariant="danger"
          />
        </>
      );
  }
};

export default BetaCampaignView;