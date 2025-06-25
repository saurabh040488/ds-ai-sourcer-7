import React, { useState, useCallback } from 'react';
import { X, Briefcase, MapPin, DollarSign, Clock, Link, Plus, Loader2, Wand2, Globe, AlertCircle } from 'lucide-react';
import { JobPosting, createJobPosting, updateJobPosting } from '../lib/supabase';
import { extractJobFromUrl, generateJobDescription, type ExtractedJobData } from '../utils/jobExtraction';
import { AuthContext } from './AuthWrapper';
import { Project } from '../lib/supabase';
import Button from './shared/Button';
import LoadingSpinner from './shared/LoadingSpinner';

interface JobPostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (jobPosting: JobPosting) => void;
  currentProject?: Project | null;
  editingJob?: JobPosting | null;
}

type CreationMethod = 'url' | 'manual' | 'ai-generate';

const JobPostingModal: React.FC<JobPostingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentProject,
  editingJob
}) => {
  const { user } = React.useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [creationMethod, setCreationMethod] = useState<CreationMethod>('url');
  
  // URL extraction state
  const [jobUrl, setJobUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string>('');
  const [hasExtracted, setHasExtracted] = useState(false); // Track if we've already extracted
  
  // AI generation state
  const [generating, setGenerating] = useState(false);
  const [jobTitleForAI, setJobTitleForAI] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false); // Track if we've already generated
  
  const [formData, setFormData] = useState({
    title: editingJob?.title || '',
    description: editingJob?.description || '',
    requirements: editingJob?.requirements || [''],
    location: editingJob?.location || '',
    salary_range: editingJob?.salary_range || '',
    employment_type: editingJob?.employment_type || 'full-time' as const,
    apply_url: editingJob?.apply_url || '',
    status: editingJob?.status || 'active' as const,
  });

  // Reset form when modal opens/closes or editing job changes
  React.useEffect(() => {
    if (isOpen) {
      if (editingJob) {
        setFormData({
          title: editingJob.title,
          description: editingJob.description,
          requirements: editingJob.requirements,
          location: editingJob.location,
          salary_range: editingJob.salary_range || '',
          employment_type: editingJob.employment_type,
          apply_url: editingJob.apply_url,
          status: editingJob.status,
        });
      } else {
        // Reset for new job
        setFormData({
          title: '',
          description: '',
          requirements: [''],
          location: '',
          salary_range: '',
          employment_type: 'full-time',
          apply_url: '',
          status: 'active',
        });
      }
      // Reset extraction states
      setJobUrl('');
      setExtractionError('');
      setHasExtracted(false);
      setJobTitleForAI('');
      setAdditionalContext('');
      setHasGenerated(false);
      setError('');
    }
  }, [isOpen, editingJob]);

  // Memoized extraction function to prevent multiple calls
  const handleExtractFromUrl = useCallback(async () => {
    if (!jobUrl.trim()) {
      setExtractionError('Please enter a valid job URL');
      return;
    }

    if (extracting || hasExtracted) {
      console.log('⚠️ Extraction already in progress or completed');
      return;
    }

    setExtracting(true);
    setExtractionError('');
    setHasExtracted(true); // Mark as extracted to prevent multiple calls
    
    try {
      console.log('🔍 Extracting job data from URL:', jobUrl);
      const extractedData = await extractJobFromUrl(jobUrl);
      
      console.log('✅ Job data extracted successfully:', extractedData);
      
      // Populate form with extracted data - ensure all fields are properly set
      setFormData(prevData => ({
        ...prevData, // Keep any existing data
        title: extractedData.title || prevData.title,
        description: extractedData.description || prevData.description,
        requirements: extractedData.requirements && extractedData.requirements.length > 0 
          ? extractedData.requirements 
          : prevData.requirements,
        location: extractedData.location || prevData.location,
        salary_range: extractedData.salary_range || prevData.salary_range,
        employment_type: extractedData.employment_type || prevData.employment_type,
        apply_url: extractedData.apply_url || jobUrl, // Use original URL as fallback
        status: prevData.status // Keep existing status
      }));
      
      console.log('✅ Form data updated with extracted information');
      setExtractionError('');
      
    } catch (error) {
      console.error('❌ Error extracting job data:', error);
      setExtractionError('Failed to extract job data. Please check the URL and try again, or fill the details manually.');
      setHasExtracted(false); // Allow retry on error
    } finally {
      setExtracting(false);
    }
  }, [jobUrl, extracting, hasExtracted]);

  // Memoized generation function to prevent multiple calls
  const handleGenerateWithAI = useCallback(async () => {
    if (!jobTitleForAI.trim()) {
      setError('Please enter a job title to generate description');
      return;
    }

    if (generating || hasGenerated) {
      console.log('⚠️ Generation already in progress or completed');
      return;
    }

    setGenerating(true);
    setError('');
    setHasGenerated(true); // Mark as generated to prevent multiple calls
    
    try {
      console.log('🤖 Generating job description for:', jobTitleForAI);
      const generated = await generateJobDescription(jobTitleForAI, additionalContext);
      
      console.log('✅ Job description generated successfully:', generated);
      
      // Populate form with generated data
      setFormData(prev => ({
        ...prev,
        title: jobTitleForAI,
        description: generated.description,
        requirements: generated.requirements && generated.requirements.length > 0 
          ? generated.requirements 
          : prev.requirements
      }));
      
      console.log('✅ Form data updated with generated content');
      
    } catch (error) {
      console.error('❌ Error generating job description:', error);
      setError('Failed to generate job description. Please try again or fill manually.');
      setHasGenerated(false); // Allow retry on error
    } finally {
      setGenerating(false);
    }
  }, [jobTitleForAI, additionalContext, generating, hasGenerated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentProject) return;

    // Validation
    if (!formData.title.trim()) {
      setError('Job title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Job description is required');
      return;
    }
    
    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }
    
    if (!formData.apply_url.trim()) {
      setError('Apply URL is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const jobData = {
        user_id: user.id,
        project_id: currentProject.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.filter(req => req.trim()),
        location: formData.location.trim(),
        salary_range: formData.salary_range.trim() || undefined,
        employment_type: formData.employment_type,
        apply_url: formData.apply_url.trim(),
        status: formData.status,
      };

      let result;
      if (editingJob) {
        result = await updateJobPosting(editingJob.id, jobData);
      } else {
        result = await createJobPosting(jobData);
      }

      if (result.error) {
        setError(result.error.message);
        return;
      }

      console.log('✅ Job posting saved successfully');
      onSuccess(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save job posting');
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
              </h2>
              <p className="text-sm text-gray-600">
                {editingJob ? 'Update job posting details' : 'Extract from URL, generate with AI, or create manually'}
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

        {/* Creation Method Selection (only for new jobs) */}
        {!editingJob && (
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex gap-2">
              <button
                onClick={() => setCreationMethod('url')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  creationMethod === 'url'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Globe className="w-4 h-4" />
                Extract from URL
              </button>
              <button
                onClick={() => setCreationMethod('ai-generate')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  creationMethod === 'ai-generate'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                Generate with AI
              </button>
              <button
                onClick={() => setCreationMethod('manual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  creationMethod === 'manual'
                    ? 'bg-gray-100 text-gray-700 border border-gray-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Create Manually
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* URL Extraction Section */}
          {!editingJob && creationMethod === 'url' && (
            <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Extract Job Details from URL
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Paste a job posting URL and we'll automatically extract all the details for you.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => {
                      setJobUrl(e.target.value);
                      setHasExtracted(false); // Reset extraction state when URL changes
                      setExtractionError('');
                    }}
                    placeholder="https://company.com/careers/job-posting"
                    className="flex-1 px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Button
                    onClick={handleExtractFromUrl}
                    loading={extracting}
                    disabled={!jobUrl.trim() || extracting}
                    icon={<Globe className="w-4 h-4" />}
                  >
                    {extracting ? 'Extracting...' : hasExtracted ? 'Re-extract' : 'Extract Job Data'}
                  </Button>
                </div>
                
                {extractionError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700">
                      <p className="font-medium mb-1">Extraction Failed</p>
                      <p>{extractionError}</p>
                    </div>
                  </div>
                )}
                
                {extracting && (
                  <div className="flex items-center gap-3 p-4 bg-white border border-blue-200 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Extracting job information...</p>
                      <p className="text-gray-600">This may take a few seconds</p>
                    </div>
                  </div>
                )}

                {hasExtracted && !extracting && !extractionError && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-green-900">Job data extracted successfully!</p>
                      <p className="text-green-700">Form has been populated with the extracted information.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Generation Section */}
          {!editingJob && creationMethod === 'ai-generate' && (
            <div className="mb-6 p-6 bg-purple-50 border border-purple-200 rounded-xl">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Generate Job Description with AI
              </h3>
              <p className="text-sm text-purple-700 mb-4">
                Provide a job title and we'll create a professional job description with requirements.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={jobTitleForAI}
                    onChange={(e) => {
                      setJobTitleForAI(e.target.value);
                      setHasGenerated(false); // Reset generation state when title changes
                    }}
                    placeholder="e.g., Senior Registered Nurse - ICU"
                    className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Additional Context (Optional)
                  </label>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={2}
                    placeholder="Any specific requirements, department, or context..."
                    className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <Button
                  onClick={handleGenerateWithAI}
                  loading={generating}
                  disabled={!jobTitleForAI.trim() || generating}
                  icon={<Wand2 className="w-4 h-4" />}
                  className="w-full"
                >
                  {generating ? 'Generating...' : hasGenerated ? 'Re-generate' : 'Generate Job Description'}
                </Button>
                
                {generating && (
                  <div className="flex items-center gap-3 p-4 bg-white border border-purple-200 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Creating professional job description...</p>
                      <p className="text-gray-600">Generating description and requirements</p>
                    </div>
                  </div>
                )}

                {hasGenerated && !generating && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-green-900">Job description generated successfully!</p>
                      <p className="text-green-700">Form has been populated with the generated content.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Job Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Senior Registered Nurse - ICU"
                required
              />
            </div>

            {/* Location and Employment Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="New York, NY"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, employment_type: e.target.value as any }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Range
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.salary_range}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary_range: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="$70,000 - $90,000"
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Job Description *
                </label>
                {!editingJob && creationMethod === 'manual' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (formData.title) {
                        setJobTitleForAI(formData.title);
                        setCreationMethod('ai-generate');
                      }
                    }}
                    icon={<Wand2 className="w-4 h-4" />}
                  >
                    Generate with AI
                  </Button>
                )}
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                required
              />
            </div>

            {/* Requirements */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Requirements
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addRequirement}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add Requirement
                </Button>
              </div>
              <div className="space-y-2">
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={requirement}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., BSN degree required"
                    />
                    {formData.requirements.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRequirement(index)}
                        icon={<X className="w-4 h-4" />}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Apply URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apply URL *
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={formData.apply_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, apply_url: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://company.com/careers/apply"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Candidates will be directed to this URL to apply
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              loading={loading}
              disabled={!formData.title || !formData.description || !formData.location || !formData.apply_url}
            >
              {editingJob ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPostingModal;