import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';
import { expandJobTitles } from '../utils/searchUtils';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onSave: (filters: any) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, filters, onSave }) => {
  const [localFilters, setLocalFilters] = useState({
    jobTitles: [],
    locations: [],
    experienceRange: {},
    skills: [],
    industries: [],
    education: null,
    ...filters
  });
  const [isExpanding, setIsExpanding] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (filters) {
      console.log('🔧 FilterModal: Loading filters:', filters);
      setLocalFilters({
        jobTitles: filters.jobTitles || [],
        locations: filters.locations || [],
        experienceRange: filters.experienceRange || {},
        skills: filters.skills || [],
        industries: filters.industries || [],
        education: filters.education || null
      });
    }
  }, [filters]);

  if (!isOpen) return null;

  const handleAddJobTitle = async () => {
    if (!newJobTitle.trim()) return;
    
    console.log('🔍 Expanding job title with AI:', newJobTitle);
    setIsExpanding(true);
    
    try {
      const expandedTitles = await expandJobTitles(newJobTitle);
      console.log('✅ Job title expansion result:', expandedTitles);
      
      setLocalFilters(prev => ({
        ...prev,
        jobTitles: [...new Set([...prev.jobTitles, ...expandedTitles])]
      }));
      setNewJobTitle('');
    } catch (error) {
      console.error('❌ Job title expansion failed:', error);
      // Fallback to just adding the original title
      setLocalFilters(prev => ({
        ...prev,
        jobTitles: [...new Set([...prev.jobTitles, newJobTitle])]
      }));
      setNewJobTitle('');
    } finally {
      setIsExpanding(false);
    }
  };

  const handleAddLocation = () => {
    if (!newLocation.trim()) return;
    setLocalFilters(prev => ({
      ...prev,
      locations: [...new Set([...prev.locations, newLocation])]
    }));
    setNewLocation('');
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    setLocalFilters(prev => ({
      ...prev,
      skills: [...new Set([...prev.skills, newSkill])]
    }));
    setNewSkill('');
  };

  const removeJobTitle = (index: number) => {
    setLocalFilters(prev => ({
      ...prev,
      jobTitles: prev.jobTitles.filter((_, i) => i !== index)
    }));
  };

  const removeLocation = (index: number) => {
    setLocalFilters(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const removeSkill = (index: number) => {
    setLocalFilters(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    console.log('💾 Saving filters:', localFilters);
    onSave(localFilters);
  };

  const handleClearAll = () => {
    console.log('🧹 Clearing all filters');
    setLocalFilters({
      jobTitles: [],
      locations: [],
      experienceRange: {},
      skills: [],
      industries: [],
      education: null
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Search Filters</h2>
            <p className="text-sm text-gray-600 mt-1">Refine your search criteria with AI-powered expansions</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {(localFilters.jobTitles?.length || 0) + (localFilters.locations?.length || 0) + (localFilters.skills?.length || 0)} filters active
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Job Titles */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-purple-600 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Job Titles
              </h3>
              <button 
                onClick={() => setLocalFilters(prev => ({ ...prev, jobTitles: [] }))}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Clear all
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="Enter job title (AI will expand with related roles)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddJobTitle()}
              />
              <button
                onClick={handleAddJobTitle}
                disabled={!newJobTitle.trim() || isExpanding}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExpanding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Expanding...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Add & Expand
                  </>
                )}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {localFilters.jobTitles?.map((title: string, index: number) => (
                <span
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {title}
                  <button 
                    onClick={() => removeJobTitle(index)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Experience Range */}
          <div>
            <h3 className="text-lg font-medium text-purple-600 mb-4">Experience Level</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Years
                </label>
                <input
                  type="number"
                  value={localFilters.experienceRange?.min || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    experienceRange: {
                      ...prev.experienceRange,
                      min: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  }))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Years
                </label>
                <input
                  type="number"
                  value={localFilters.experienceRange?.max || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    experienceRange: {
                      ...prev.experienceRange,
                      max: e.target.value ? parseInt(e.target.value) : undefined
                    }
                  }))}
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Locations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-purple-600">Locations</h3>
              <button 
                onClick={() => setLocalFilters(prev => ({ ...prev, locations: [] }))}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Clear all
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="City, State, or Country"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
              />
              <button
                onClick={handleAddLocation}
                disabled={!newLocation.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {localFilters.locations?.map((location: string, index: number) => (
                <span
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  {location}
                  <button 
                    onClick={() => removeLocation(index)}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-purple-600">Skills & Specializations</h3>
              <button 
                onClick={() => setLocalFilters(prev => ({ ...prev, skills: [] }))}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Clear all
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Skills, certifications, specializations"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              />
              <button
                onClick={handleAddSkill}
                disabled={!newSkill.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {localFilters.skills?.map((skill: string, index: number) => (
                <span
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                >
                  {skill}
                  <button 
                    onClick={() => removeSkill(index)}
                    className="hover:bg-orange-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className="text-lg font-medium text-purple-600 mb-4">Education Requirements</h3>
            <select
              value={localFilters.education || ''}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                education: e.target.value || null
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">No specific requirement</option>
              <option value="High School">High School Diploma</option>
              <option value="Associate">Associate Degree</option>
              <option value="Bachelor">Bachelor's Degree</option>
              <option value="Master">Master's Degree</option>
              <option value="Doctorate">Doctorate/PhD</option>
              <option value="Certificate">Professional Certificate</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleClearAll}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Clear all filters
              </button>
              <div className="text-sm text-gray-500">
                {(localFilters.jobTitles?.length || 0) + (localFilters.locations?.length || 0) + (localFilters.skills?.length || 0)} active filters
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;