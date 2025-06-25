import React, { useState } from 'react';
import { ArrowLeft, Mail, Send, Eye, Plus, Trash2, Clock, User, Loader2, Save, Edit3, Copy, Play, EyeOff, X, Code, Type } from 'lucide-react';
import { type EmailStep } from '../utils/openai';
import { AuthContext } from './AuthWrapper';
import { Project, createCampaign, updateCampaign, Campaign } from '../lib/supabase';

interface CampaignStepsEditorProps {
  onBack: () => void;
  onSave: (campaignData: any) => void;
  campaignData: any;
  emailSteps: EmailStep[];
  editingCampaign?: Campaign | null;
  currentProject?: Project | null;
}

const CampaignStepsEditor: React.FC<CampaignStepsEditorProps> = ({
  onBack,
  onSave,
  campaignData,
  emailSteps: initialEmailSteps,
  editingCampaign,
  currentProject
}) => {
  const { user } = React.useContext(AuthContext);
  
  const [emailSteps, setEmailSteps] = useState<EmailStep[]>(initialEmailSteps);
  const [activeStepId, setActiveStepId] = useState<string>(initialEmailSteps[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  const [testEmail, setTestEmail] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTestCandidate, setSelectedTestCandidate] = useState('John Smith');
  const [viewMode, setViewMode] = useState<'html' | 'preview'>('html');

  const testCandidates = [
    { name: 'John Smith', company: 'Memorial Healthcare' },
    { name: 'Sarah Johnson', company: 'Baptist Health' },
    { name: 'Michael Brown', company: 'Jackson Health System' },
    { name: 'Emily Davis', company: 'Cleveland Clinic' }
  ];

  const updateEmailStep = (stepId: string, field: keyof EmailStep, value: any) => {
    setEmailSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    ));
  };

  const addEmailStep = () => {
    const newStep: EmailStep = {
      id: `step-${emailSteps.length + 1}`,
      type: 'email',
      subject: 'Following up on our conversation',
      content: `<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
  <tr>
    <td style="padding: 20px;">
      <h2 style="color: #333; font-size: 20px; margin: 0 0 15px 0;">Hi {{First Name}},</h2>
      
      <p style="color: #555; font-size: 16px; margin: 0 0 15px 0;">
        I wanted to follow up on our previous conversation about opportunities at <strong style="color: #333;">{{Company Name}}</strong>.
      </p>
      
      <p style="color: #555; font-size: 16px; margin: 0 0 15px 0;">
        We have some exciting new positions that might be a perfect fit for your background and career goals:
      </p>
      
      <ul style="color: #555; font-size: 16px; margin: 15px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Competitive compensation packages</li>
        <li style="margin-bottom: 8px;">Comprehensive benefits</li>
        <li style="margin-bottom: 8px;">Professional development opportunities</li>
      </ul>
      
      <p style="color: #555; font-size: 16px; margin: 15px 0;">
        Would you be available for a brief call this week to discuss? 
        <a href="#" style="color: #0066cc; text-decoration: none; font-weight: bold;">Schedule a conversation</a>
      </p>
      
      <p style="color: #555; font-size: 16px; margin: 15px 0 0 0;">
        Best regards,<br>
        <strong style="color: #333;">{{Your Name}}</strong>
      </p>
    </td>
  </tr>
</table>`,
      delay: emailSteps.length === 0 ? 0 : 3,
      delayUnit: emailSteps.length === 0 ? 'immediately' : 'business days'
    };
    setEmailSteps(prev => [...prev, newStep]);
    setActiveStepId(newStep.id);
  };

  const removeEmailStep = (stepId: string) => {
    const stepIndex = emailSteps.findIndex(step => step.id === stepId);
    setEmailSteps(prev => prev.filter(step => step.id !== stepId));
    
    const remainingSteps = emailSteps.filter(step => step.id !== stepId);
    if (remainingSteps.length > 0) {
      const newActiveIndex = Math.max(0, stepIndex - 1);
      setActiveStepId(remainingSteps[newActiveIndex]?.id || remainingSteps[0]?.id);
    }
  };

  const duplicateEmailStep = (stepId: string) => {
    const stepToDuplicate = emailSteps.find(step => step.id === stepId);
    if (stepToDuplicate) {
      const newStep: EmailStep = {
        ...stepToDuplicate,
        id: `step-${Date.now()}`,
        subject: `${stepToDuplicate.subject} (Copy)`,
        delay: 3,
        delayUnit: 'business days'
      };
      const stepIndex = emailSteps.findIndex(step => step.id === stepId);
      setEmailSteps(prev => [
        ...prev.slice(0, stepIndex + 1),
        newStep,
        ...prev.slice(stepIndex + 1)
      ]);
      setActiveStepId(newStep.id);
    }
  };

  const validateCampaignData = () => {
    const errors: string[] = [];
    
    if (!campaignData.name?.trim()) {
      errors.push('Campaign name is required');
    }
    
    if (!campaignData.type) {
      errors.push('Campaign type is required');
    }
    
    if (!campaignData.targetAudience?.trim()) {
      errors.push('Target audience is required');
    }
    
    if (!campaignData.campaignGoal?.trim()) {
      errors.push('Campaign goal is required');
    }
    
    if (!emailSteps || emailSteps.length === 0) {
      errors.push('At least one email step is required');
    }
    
    if (!user?.id) {
      errors.push('User authentication required');
    }
    
    if (!currentProject?.id) {
      errors.push('Project selection required');
    }
    
    emailSteps.forEach((step, index) => {
      if (!step.subject?.trim()) {
        errors.push(`Email step ${index + 1}: Subject is required`);
      }
      if (!step.content?.trim()) {
        errors.push(`Email step ${index + 1}: Content is required`);
      }
      if (step.delayUnit !== 'immediately' && step.delayUnit !== 'business days') {
        errors.push(`Email step ${index + 1}: Invalid delay unit (must be 'immediately' or 'business days')`);
      }
    });
    
    return errors;
  };

  const handleSave = async () => {
    console.log('💾 Starting campaign save process...');
    setSaveError('');
    
    const validationErrors = validateCampaignData();
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join(', ');
      console.error('❌ Validation failed:', validationErrors);
      setSaveError(`Please fix the following issues: ${errorMessage}`);
      return;
    }

    setIsSaving(true);
    
    try {
      const fullCampaignData = {
        user_id: user!.id,
        project_id: currentProject!.id,
        name: campaignData.name.trim(),
        type: campaignData.type as 'nurture' | 'enrichment' | 'keep-warm' | 'reengage',
        status: 'draft' as const,
        target_audience: campaignData.targetAudience.trim(),
        campaign_goal: campaignData.campaignGoal.trim(),
        content_sources: campaignData.contentSources || [],
        ai_instructions: campaignData.aiInstructions?.trim() || null,
        tone: campaignData.tone,
        company_name: campaignData.companyName.trim(),
        recruiter_name: campaignData.recruiterName.trim(),
        settings: {},
        stats: { sent: 0, opened: 0, replied: 0 }
      };

      const steps = emailSteps.map((step, index) => {
        let delayUnit: 'immediately' | 'business days' = 'business days';
        if (step.delayUnit === 'immediately' || step.delayUnit === 'business days') {
          delayUnit = step.delayUnit;
        } else {
          delayUnit = index === 0 ? 'immediately' : 'business days';
        }

        return {
          step_order: index + 1,
          type: step.type,
          subject: step.subject.trim(),
          content: step.content.trim(),
          delay: Math.max(0, step.delay || 0),
          delay_unit: delayUnit
        };
      });

      console.log('📊 Campaign data prepared:', {
        campaignData: { ...fullCampaignData, content_sources: `${fullCampaignData.content_sources.length} sources` },
        stepsCount: steps.length,
        stepsValidation: steps.map(s => ({ order: s.step_order, delay_unit: s.delay_unit }))
      });

      let result;
      if (editingCampaign?.id) {
        console.log('✏️ Updating existing campaign:', editingCampaign.id);
        result = await updateCampaign(editingCampaign.id, fullCampaignData, steps);
      } else {
        console.log('📝 Creating new campaign');
        result = await createCampaign(fullCampaignData, steps);
      }

      if (result.error) {
        console.error('❌ Database error saving campaign:', result.error);
        setSaveError(`Failed to save campaign: ${result.error.message || 'Unknown database error'}`);
        return;
      }

      console.log('✅ Campaign saved successfully:', result.data?.id);
      onSave(result.data);
      
    } catch (error) {
      console.error('❌ Exception in handleSave:', error);
      setSaveError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestEmail = () => {
    if (testEmail) {
      console.log('📧 Sending test email to:', testEmail);
      setSaveError('Test email feature coming soon!');
    } else {
      setSaveError('Please enter an email address for testing');
    }
  };

  const insertPersonalizationToken = (token: string) => {
    if (activeStep) {
      const currentContent = activeStep.content;
      const insertion = `{{${token}}}`;
      
      // For HTML content, try to insert at cursor position or at the end of content
      updateEmailStep(activeStep.id, 'content', currentContent + insertion);
    }
  };

  const insertHTMLTemplate = (templateType: string) => {
    if (!activeStep) return;
    
    let template = '';
    
    switch (templateType) {
      case 'button':
        template = `<div style="margin: 20px 0;">
  <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Click Here</a>
</div>`;
        break;
      case 'list':
        template = `<ul style="color: #555; font-size: 16px; margin: 15px 0; padding-left: 20px;">
  <li style="margin-bottom: 8px;">First item</li>
  <li style="margin-bottom: 8px;">Second item</li>
  <li style="margin-bottom: 8px;">Third item</li>
</ul>`;
        break;
      case 'section':
        template = `<div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #0066cc; border-radius: 4px;">
  <h3 style="color: #333; font-size: 18px; margin: 0 0 10px 0;">Section Heading</h3>
  <p style="color: #555; font-size: 16px; margin: 0;">Important information goes here.</p>
</div>`;
        break;
      case 'quote':
        template = `<blockquote style="margin: 20px 0; padding: 10px 20px; border-left: 4px solid #ccc; font-style: italic; color: #666;">
  "This is a testimonial or quote that adds credibility to your message."
</blockquote>`;
        break;
      case 'image':
        template = `<div style="margin: 20px 0; text-align: center;">
  <img src="https://example.com/image.jpg" alt="Description of image" style="max-width: 100%; height: auto; border-radius: 4px;" />
  <p style="color: #777; font-size: 14px; margin-top: 5px;">Caption text</p>
</div>`;
        break;
      default:
        return;
    }
    
    updateEmailStep(activeStep.id, 'content', activeStep.content + template);
  };

  const activeStep = emailSteps.find(step => step.id === activeStepId);
  const selectedCandidate = testCandidates.find(c => c.name === selectedTestCandidate) || testCandidates[0];

  const renderPreviewContent = (content: string) => {
    // Replace personalization tokens with actual values
    let processedContent = content
      .replace(/\{\{First Name\}\}/g, selectedCandidate.name.split(' ')[0])
      .replace(/\{\{Current Company\}\}/g, selectedCandidate.company)
      .replace(/\{\{Company Name\}\}/g, campaignData.companyName)
      .replace(/\{\{Your Name\}\}/g, campaignData.recruiterName);

    return processedContent;
  };

  const renderPreviewSubject = (subject: string) => {
    return subject
      .replace(/\{\{First Name\}\}/g, selectedCandidate.name.split(' ')[0])
      .replace(/\{\{Current Company\}\}/g, selectedCandidate.company)
      .replace(/\{\{Company Name\}\}/g, campaignData.companyName)
      .replace(/\{\{Your Name\}\}/g, campaignData.recruiterName);
  };

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
              <h1 className="text-xl font-semibold text-gray-900">{campaignData.name}</h1>
              <p className="text-sm text-gray-600">
                Configure email sequence • {emailSteps.length} steps • {currentProject?.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                showPreview 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving || !campaignData.name || emailSteps.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : (editingCampaign ? 'Update Campaign' : 'Save Campaign')}
            </button>
          </div>
        </div>
        
        {saveError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{saveError}</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Email Sequence */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Email Sequence</h3>
              <button
                onClick={addEmailStep}
                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Add Email Step"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600">{emailSteps.length} steps configured</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {emailSteps.length === 0 ? (
              <div className="p-6 text-center">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-4">No email steps configured</p>
                <button
                  onClick={addEmailStep}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  Add First Step
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {emailSteps.map((step, index) => (
                  <div
                    key={step.id}
                    onClick={() => setActiveStepId(step.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      activeStepId === step.id
                        ? 'border-purple-300 bg-purple-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                          STEP {index + 1}
                        </span>
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateEmailStep(step.id);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Duplicate Step"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeEmailStep(step.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Step"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-900 font-medium mb-1 truncate">
                      {step.subject}
                    </div>
                    
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {step.delay === 0 ? (
                        'Send immediately'
                      ) : (
                        `Send after ${step.delay} ${step.delayUnit}`
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Email Editor */}
          <div className={`${showPreview ? 'w-1/2' : 'flex-1'} flex flex-col border-r border-gray-200`}>
            {activeStep ? (
              <>
                <div className="flex-1 p-6 overflow-y-auto bg-white">
                  <div className="max-w-4xl">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                          STEP {emailSteps.findIndex(s => s.id === activeStep.id) + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900">Email Configuration</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-4">
                        {activeStep.delay === 0 ? (
                          <span>When profiles are added, send this email immediately</span>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>If no response, send email after</span>
                            <select
                              value={activeStep.delay}
                              onChange={(e) => updateEmailStep(activeStep.id, 'delay', parseInt(e.target.value))}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              {[1,2,3,4,5,6,7,10,14].map(num => (
                                <option key={num} value={num}>{num}</option>
                              ))}
                            </select>
                            <select
                              value={activeStep.delayUnit}
                              onChange={(e) => updateEmailStep(activeStep.id, 'delayUnit', e.target.value as 'immediately' | 'business days')}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="business days">business days</option>
                              <option value="immediately">immediately</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Subject Line */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                        <input
                          type="text"
                          value={activeStep.subject}
                          onChange={(e) => updateEmailStep(activeStep.id, 'subject', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                          placeholder="Enter email subject..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use personalization tokens like First Name, Company Name, Current Company
                        </p>
                      </div>
                      
                      {/* Email Body */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">Email Body (HTML)</label>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setViewMode(viewMode === 'html' ? 'preview' : 'html')}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded flex items-center gap-1"
                              title={viewMode === 'html' ? "Show HTML Preview" : "Edit HTML"}
                            >
                              {viewMode === 'html' ? <Eye className="w-3 h-3" /> : <Code className="w-3 h-3" />}
                              {viewMode === 'html' ? "Preview" : "HTML"}
                            </button>
                            <button 
                              onClick={() => insertPersonalizationToken('First Name')}
                              className="px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded"
                            >
                              + First Name
                            </button>
                            <button 
                              onClick={() => insertPersonalizationToken('Company Name')}
                              className="px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded"
                            >
                              + Company
                            </button>
                            <button 
                              onClick={() => insertPersonalizationToken('Current Company')}
                              className="px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded"
                            >
                              + Current Company
                            </button>
                            <button 
                              onClick={() => insertPersonalizationToken('Your Name')}
                              className="px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded"
                            >
                              + Your Name
                            </button>
                          </div>
                        </div>
                        
                        {viewMode === 'html' ? (
                          <textarea
                            value={activeStep.content}
                            onChange={(e) => updateEmailStep(activeStep.id, 'content', e.target.value)}
                            rows={16}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                            placeholder="Enter HTML email content..."
                          />
                        ) : (
                          <div className="border border-gray-300 rounded-lg p-4 h-96 overflow-auto bg-white">
                            <div dangerouslySetInnerHTML={{ __html: renderPreviewContent(activeStep.content) }} />
                          </div>
                        )}
                        
                        {/* HTML Templates */}
                        <div className="mt-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">Insert HTML Template:</span>
                            <button 
                              onClick={() => insertHTMLTemplate('button')}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                            >
                              Button
                            </button>
                            <button 
                              onClick={() => insertHTMLTemplate('list')}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                            >
                              List
                            </button>
                            <button 
                              onClick={() => insertHTMLTemplate('section')}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                            >
                              Section
                            </button>
                            <button 
                              onClick={() => insertHTMLTemplate('quote')}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                            >
                              Quote
                            </button>
                            <button 
                              onClick={() => insertHTMLTemplate('image')}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
                            >
                              Image
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Email Section */}
                <div className="bg-gray-50 border-t border-gray-200 p-4">
                  <div className="max-w-4xl">
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Send Test Email
                    </h5>
                    <div className="flex gap-3">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button 
                        onClick={sendTestEmail}
                        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        Send Test
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white">
                <div className="text-center">
                  <Mail className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-medium text-gray-900 mb-3">No Step Selected</h3>
                  <p className="text-gray-600 mb-6">Select an email step from the left panel to configure it</p>
                  <button
                    onClick={addEmailStep}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Add First Email Step
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {showPreview && activeStep && (
            <div className="w-1/2 bg-white flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Email Preview
                  </h4>
                  <select 
                    value={selectedTestCandidate}
                    onChange={(e) => setSelectedTestCandidate(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded"
                  >
                    {testCandidates.map(candidate => (
                      <option key={candidate.name} value={candidate.name}>
                        {candidate.name} - {candidate.company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-1">Subject:</div>
                    <div className="text-lg font-medium text-gray-900">
                      {renderPreviewSubject(activeStep.subject)}
                    </div>
                  </div>
                  
                  <div className="text-gray-900">
                    <div dangerouslySetInnerHTML={{ __html: renderPreviewContent(activeStep.content) }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignStepsEditor;