import React, { useState, useContext } from 'react';
import { ArrowLeft, Wand2, Loader2, Sparkles, Target, Users, MessageSquare, Building, User, FileText, Upload, Plus, Trash2 } from 'lucide-react';
import { generateCampaignSequence, generateCampaignName, type CampaignPrompt, type EmailStep } from '../utils/openai';
import { AuthContext } from './AuthWrapper';
import { Project } from '../lib/supabase';

interface CampaignTemplate {
  id: string;
  name: string;
  steps: number;
  days: number;
  description: string;
  icon: any;
  color: string;
  category?: string;
  contentSuggestions?: string[];
}

interface CampaignSetupProps {
  onBack: () => void;
  onProceedToSteps: (campaignData: any, emailSteps: EmailStep[]) => void;
  campaignTemplates: CampaignTemplate[];
  currentProject?: Project | null;
}

interface ContentSource {
  type: 'existing' | 'external';
  content: string;
  title: string;
}

interface GenerationProgress {
  stage: 'preparing' | 'analyzing' | 'generating' | 'finalizing' | 'complete';
  message: string;
  progress: number;
}

const CampaignSetup: React.FC<CampaignSetupProps> = ({
  onBack,
  onProceedToSteps,
  campaignTemplates,
  currentProject
}) => {
  const { user } = useContext(AuthContext);
  
  // Core campaign data
  const [campaignName, setCampaignName] = useState('');
  const [selectedType, setSelectedType] = useState<string>('nurture');
  const [targetAudience, setTargetAudience] = useState('');
  const [campaignGoal, setCampaignGoal] = useState('');
  const [tone, setTone] = useState('professional');
  const [emailLength, setEmailLength] = useState<'short' | 'concise' | 'medium' | 'long'>('concise');
  const [companyName, setCompanyName] = useState('HCA Healthcare');
  const [recruiterName, setRecruiterName] = useState('Sarah Johnson');
  
  // Content management
  const [contentSources, setContentSources] = useState<ContentSource[]>([]);
  const [aiInstructions, setAiInstructions] = useState('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState<string>('');

  // Campaign types with enhanced design
  const campaignTypes = [
    {
      id: 'nurture',
      name: 'Nurture Campaign',
      category: 'Long-term relationship building',
      description: 'Build talent community by keeping candidates engaged over time',
      icon: MessageSquare,
      color: 'from-blue-500 to-blue-600',
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      contentSuggestions: ['Company news', 'Benefits information', 'Company culture', 'DEI initiatives']
    },
    {
      id: 'enrichment',
      name: 'Enrichment Campaign',
      category: 'Educational content-driven',
      description: 'Engage with valuable, educational content to build trust',
      icon: Target,
      color: 'from-green-500 to-green-600',
      borderColor: 'border-green-200',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      contentSuggestions: ['Application tips', 'Interview advice', 'Industry insights', 'Career guidance']
    },
    {
      id: 'keep-warm',
      name: 'Keep Warm',
      category: 'Short-term engagement',
      description: 'Maintain engagement with interested candidates',
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      borderColor: 'border-orange-200',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      contentSuggestions: ['Job alerts', 'Personalized updates', 'New opportunities']
    },
    {
      id: 'reengage',
      name: 'Reengage Campaign',
      category: 'Reconnect non-responsive',
      description: 'Reconnect with candidates who haven\'t responded',
      icon: Sparkles,
      color: 'from-purple-500 to-purple-600',
      borderColor: 'border-purple-200',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      contentSuggestions: ['Talent network invitations', 'Special opportunities', 'Reengagement offers']
    }
  ];

  const audienceTemplates = [
    'National campaigns (continuous outreach to keep candidates warm)',
    'New grads entering healthcare field',
    'Contacted leads from previous outreach',
    'Nonresponsive disposition candidates',
    'Future prospects (passive candidates for long-term nurturing)',
    'Competitor targeting (professionals at competing organizations)',
    'Hard to fill roles (specialized positions)',
    'Hospital closures (displaced healthcare workers)',
    'Florida licensure list (location-specific targeting)'
  ];

  const goalTemplates = [
    'Keep candidates warm for future opportunities',
    'Build company awareness and brand recognition',
    'Provide educational content and professional value',
    'Reconnect with previous applicants who didn\'t respond',
    'Promote specific job openings and opportunities',
    'Invite candidates to join our talent network',
    'Share company benefits and culture information',
    'Target specific locations or departments'
  ];

  // Email length options
  const emailLengthOptions = [
    { value: 'short', label: 'Short', description: '30-50 words, brief and to the point' },
    { value: 'concise', label: 'Concise', description: '60-80 words, balanced and focused' },
    { value: 'medium', label: 'Medium', description: '100-120 words, detailed but readable' },
    { value: 'long', label: 'Long', description: '150+ words, comprehensive and thorough' }
  ];

  // Auto-generate campaign name when key fields change
  React.useEffect(() => {
    if (selectedType && targetAudience && campaignGoal) {
      const generateName = async () => {
        try {
          const name = await generateCampaignName(selectedType, targetAudience, campaignGoal);
          setCampaignName(name);
        } catch (error) {
          console.error('❌ Error generating campaign name:', error);
          setCampaignName(`${selectedType} Campaign`);
        }
      };
      generateName();
    }
  }, [selectedType, targetAudience, campaignGoal]);

  const addContentSource = (type: 'existing' | 'external') => {
    const newSource: ContentSource = {
      type,
      content: '',
      title: type === 'existing' ? 'Existing Content' : 'External Content'
    };
    setContentSources(prev => [...prev, newSource]);
  };

  const updateContentSource = (index: number, field: keyof ContentSource, value: string) => {
    setContentSources(prev => prev.map((source, i) => 
      i === index ? { ...source, [field]: value } : source
    ));
  };

  const removeContentSource = (index: number) => {
    setContentSources(prev => prev.filter((_, i) => i !== index));
  };

  const simulateProgress = (onComplete: () => void) => {
    const stages: GenerationProgress[] = [
      { stage: 'preparing', message: 'Preparing campaign parameters...', progress: 20 },
      { stage: 'analyzing', message: 'Analyzing target audience and goals...', progress: 40 },
      { stage: 'generating', message: 'Generating personalized email sequence...', progress: 70 },
      { stage: 'finalizing', message: 'Finalizing campaign structure...', progress: 90 },
      { stage: 'complete', message: 'Campaign sequence generated successfully!', progress: 100 }
    ];

    let currentStage = 0;
    
    const updateProgress = () => {
      if (currentStage < stages.length) {
        setGenerationProgress(stages[currentStage]);
        currentStage++;
        
        if (currentStage < stages.length) {
          setTimeout(updateProgress, 1000 + Math.random() * 1000);
        } else {
          setTimeout(onComplete, 500);
        }
      }
    };
    
    updateProgress();
  };

  const handleGenerateSequence = async () => {
    if (!selectedType || !targetAudience || !campaignGoal) {
      setError('Please fill in campaign type, target audience, and campaign goal');
      return;
    }

    console.log('🤖 Starting campaign sequence generation...');
    setIsGenerating(true);
    setError('');
    
    try {
      const prompt: CampaignPrompt = {
        campaignType: selectedType,
        targetAudience,
        campaignGoal,
        contentSources: contentSources.map(source => `${source.title}: ${source.content}`),
        aiInstructions,
        tone,
        emailLength,
        companyName,
        recruiterName
      };

      // Start progress simulation
      simulateProgress(async () => {
        try {
          console.log('📤 Sending generation request with prompt:', prompt);
          const generatedSteps = await generateCampaignSequence(prompt);
          
          // Validate and fix delay_unit values
          const validatedSteps = generatedSteps.map((step, index) => ({
            ...step,
            delayUnit: (step.delayUnit === 'immediately' || step.delayUnit === 'business days') 
              ? step.delayUnit 
              : (index === 0 ? 'immediately' : 'business days') as 'immediately' | 'business days'
          }));
          
          console.log('✅ Campaign sequence generated successfully:', validatedSteps.length, 'steps');
          
          // Prepare campaign data
          const campaignData = {
            name: campaignName,
            type: selectedType,
            targetAudience,
            campaignGoal,
            contentSources,
            aiInstructions,
            tone,
            emailLength,
            companyName,
            recruiterName
          };
          
          // Proceed to steps editor
          onProceedToSteps(campaignData, validatedSteps);
          
        } catch (error) {
          console.error('❌ Error generating sequence:', error);
          setError('Error generating sequence. Please check your OpenAI API key and try again.');
          setIsGenerating(false);
          setGenerationProgress(null);
        }
      });
      
    } catch (error) {
      console.error('❌ Error in handleGenerateSequence:', error);
      setError('Error generating sequence. Please check your OpenAI API key and try again.');
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  const selectedCampaignType = campaignTypes.find(t => t.id === selectedType);

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Project Selected</h3>
          <p className="text-gray-600">Please select a project to create campaigns.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Create New Campaign</h1>
              <p className="text-sm text-gray-600">Configure your campaign settings • {currentProject.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Campaign Name */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-medium"
                placeholder="Campaign name will be auto-generated..."
              />
              <p className="text-xs text-gray-500 mt-2">Auto-generated based on your campaign settings</p>
            </div>
          </div>

          {/* Campaign Type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaignTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? `${type.borderColor} ${type.bgColor} shadow-lg scale-105`
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${type.color} shadow-sm`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${isSelected ? type.textColor : 'text-gray-900'}`}>
                          {type.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{type.category}</p>
                        <p className="text-sm text-gray-700">{type.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {selectedCampaignType && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">Content Suggestions for {selectedCampaignType.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCampaignType.contentSuggestions?.map((suggestion, index) => (
                    <span key={index} className="px-3 py-1 bg-white text-purple-700 rounded-full text-sm font-medium shadow-sm">
                      {suggestion}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Target Audience & Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Target Audience */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Target Audience</h2>
              <textarea
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Describe your target audience..."
              />
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {audienceTemplates.slice(0, 4).map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setTargetAudience(template)}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Campaign Goal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Goal</h2>
              <textarea
                value={campaignGoal}
                onChange={(e) => setCampaignGoal(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="What do you want to achieve with this campaign?"
              />
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Common Goals:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {goalTemplates.slice(0, 4).map((goal, index) => (
                    <button
                      key={index}
                      onClick={() => setCampaignGoal(goal)}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content Sources */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Content Sources</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => addContentSource('existing')}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Add Existing
                </button>
                <button
                  onClick={() => addContentSource('external')}
                  className="flex items-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Import External
                </button>
              </div>
            </div>
            
            {contentSources.length > 0 ? (
              <div className="space-y-4">
                {contentSources.map((source, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <input
                        type="text"
                        value={source.title}
                        onChange={(e) => updateContentSource(index, 'title', e.target.value)}
                        className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none flex-1"
                        placeholder="Content title"
                      />
                      <button
                        onClick={() => removeContentSource(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={source.content}
                      onChange={(e) => updateContentSource(index, 'content', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Paste your content here..."
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">No content sources added yet</p>
                <p className="text-xs">Add existing content or import external sources to enhance your campaign</p>
              </div>
            )}
          </div>

          {/* AI Instructions & Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* AI Instructions */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Instructions
              </h2>
              <textarea
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Specific instructions for AI content generation (tone, style, key points...)"
              />
            </div>

            {/* Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Length</label>
                  <select
                    value={emailLength}
                    onChange={(e) => setEmailLength(e.target.value as 'short' | 'concise' | 'medium' | 'long')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {emailLengthOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.description})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recruiter</label>
                  <input
                    type="text"
                    value={recruiterName}
                    onChange={(e) => setRecruiterName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <button
                onClick={handleGenerateSequence}
                disabled={isGenerating || !selectedType || !targetAudience || !campaignGoal}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating Campaign...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    Generate Campaign with AI
                  </>
                )}
              </button>
              
              {!isGenerating && (
                <p className="text-sm text-gray-600 mt-3">
                  AI will create a personalized email sequence based on your settings
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generation Progress Overlay */}
      {isGenerating && generationProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Generating Your Campaign
              </h3>
              
              <p className="text-gray-600 mb-6">
                {generationProgress.message}
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${generationProgress.progress}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-500">
                {generationProgress.progress}% complete
              </p>
              
              {/* Stage Indicators */}
              <div className="flex justify-center gap-2 mt-6">
                {['preparing', 'analyzing', 'generating', 'finalizing'].map((stage, index) => (
                  <div
                    key={stage}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      generationProgress.stage === stage
                        ? 'bg-purple-600 scale-125'
                        : generationProgress.progress > (index + 1) * 20
                        ? 'bg-purple-400'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignSetup;