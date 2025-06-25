import React, { useState } from 'react';
import { X, Settings, Cpu, Sparkles, Zap, Sliders, Save, RotateCcw, Info } from 'lucide-react';
import { 
  AI_MODELS, 
  AI_TASK_MODELS, 
  AI_PROMPTS, 
  updateTaskModel, 
  updatePrompt,
  getAIConfiguration
} from '../config/ai';
import Button from './shared/Button';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'models' | 'prompts'>('models');
  const [modelAssignments, setModelAssignments] = useState({ ...AI_TASK_MODELS });
  const [prompts, setPrompts] = useState({ ...AI_PROMPTS });
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [promptContent, setPromptContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  if (!isOpen) return null;

  const handleModelChange = (task: string, model: string) => {
    setModelAssignments(prev => ({
      ...prev,
      [task]: model
    }));
    setHasChanges(true);
  };

  const handleEditPrompt = (promptKey: string) => {
    setEditingPrompt(promptKey);
    setPromptContent(prompts[promptKey].system);
  };

  const handleSavePrompt = () => {
    if (!editingPrompt) return;
    
    setPrompts(prev => ({
      ...prev,
      [editingPrompt]: {
        ...prev[editingPrompt],
        system: promptContent
      }
    }));
    setEditingPrompt(null);
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    // Update model assignments
    Object.entries(modelAssignments).forEach(([task, model]) => {
      if (AI_TASK_MODELS[task as keyof typeof AI_TASK_MODELS] !== model) {
        updateTaskModel(task as keyof typeof AI_TASK_MODELS, model as keyof typeof AI_MODELS);
      }
    });

    // Update prompts
    Object.entries(prompts).forEach(([key, value]) => {
      if (AI_PROMPTS[key].system !== value.system) {
        updatePrompt(key as keyof typeof AI_PROMPTS, { system: value.system });
      }
    });

    setHasChanges(false);
    onClose();
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all AI settings to defaults?')) {
      setModelAssignments({ ...AI_TASK_MODELS });
      setPrompts({ ...AI_PROMPTS });
      setHasChanges(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Configuration</h2>
              <p className="text-sm text-gray-600">Customize AI models and prompts for different tasks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('models')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'models'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Model Assignments
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('prompts')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'prompts'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                System Prompts
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'models' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Model Selection Guide</h4>
                    <p className="text-sm text-blue-700">
                      Choose the appropriate model for each task based on your needs:
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• <strong>gpt-4o-mini</strong>: Fast and cost-effective for simple tasks</li>
                      <li>• <strong>gpt-4o</strong>: Balanced performance for most tasks</li>
                      <li>• <strong>gpt-4</strong>: High quality for complex tasks</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Task Model Assignments</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(modelAssignments).map(([task, model]) => (
                    <div key={task} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{formatTaskName(task)}</h4>
                          <p className="text-sm text-gray-600">{getTaskDescription(task)}</p>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Zap className="w-4 h-4 text-purple-600" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assigned Model
                        </label>
                        <select
                          value={model}
                          onChange={(e) => handleModelChange(task, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          {Object.keys(AI_MODELS).map((modelKey) => (
                            <option key={modelKey} value={modelKey}>
                              {modelKey} - {AI_MODELS[modelKey as keyof typeof AI_MODELS].description}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prompts' && (
            <div className="space-y-6">
              {editingPrompt ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Editing: {formatTaskName(editingPrompt)}
                    </h3>
                    <Button
                      onClick={handleSavePrompt}
                      icon={<Save className="w-4 h-4" />}
                    >
                      Save Prompt
                    </Button>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900 mb-1">Editing Guidelines</h4>
                        <p className="text-sm text-yellow-700">
                          Modify the system prompt carefully. Changes will affect AI behavior for this task.
                          Ensure the prompt maintains the expected output format and quality.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      System Prompt
                    </label>
                    <textarea
                      value={promptContent}
                      onChange={(e) => setPromptContent(e.target.value)}
                      rows={20}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">System Prompts by Category</h3>
                  
                  {/* Group prompts by category */}
                  {Object.entries(groupPromptsByCategory(prompts)).map(([category, categoryPrompts]) => (
                    <div key={category} className="space-y-3">
                      <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">
                        {category}
                      </h4>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(categoryPrompts).map(([key, prompt]) => (
                          <div key={key} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h5 className="font-medium text-gray-900">{formatTaskName(key)}</h5>
                                <p className="text-sm text-gray-600">{prompt.description}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditPrompt(key)}
                                icon={<Sliders className="w-4 h-4" />}
                              >
                                Edit
                              </Button>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-600 line-clamp-3 font-mono">
                                {prompt.system.substring(0, 150)}...
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleResetDefaults}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Reset to Defaults
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={!hasChanges}
                icon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function formatTaskName(task: string): string {
  return task
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .replace(/([A-Z])\s([A-Z])/g, '$1$2'); // Remove space between consecutive capitals
}

function getTaskDescription(task: string): string {
  const descriptions: Record<string, string> = {
    entityExtraction: 'Extract structured data from search queries',
    jobTitleExpansion: 'Expand job titles to related roles',
    candidateMatching: 'Score and analyze candidate matches',
    campaignGeneration: 'Generate email campaign sequences',
    jobExtraction: 'Extract job details from postings',
    companyBranding: 'Extract company branding information',
    campaignNaming: 'Generate campaign names'
  };
  
  return descriptions[task] || 'AI task';
}

function groupPromptsByCategory(prompts: typeof AI_PROMPTS) {
  const grouped: Record<string, Record<string, typeof AI_PROMPTS[keyof typeof AI_PROMPTS]>> = {};
  
  Object.entries(prompts).forEach(([key, prompt]) => {
    const category = prompt.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = {};
    }
    grouped[category][key] = prompt;
  });
  
  return grouped;
}

export default AISettingsModal;