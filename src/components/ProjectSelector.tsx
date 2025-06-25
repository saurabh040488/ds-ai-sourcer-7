import React, { useState, useEffect, useContext } from 'react';
import { Plus, Folder, Settings, ChevronDown, Building, Users, Calendar } from 'lucide-react';
import { AuthContext } from './AuthWrapper';
import { getProjects, createProject, Project } from '../lib/supabase';

interface ProjectSelectorProps {
  currentProject: Project | null;
  onProjectChange: (project: Project) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ currentProject, onProjectChange }) => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;
    
    console.log('📁 Loading projects for user:', user.email);
    setLoading(true);
    
    try {
      const { data, error } = await getProjects(user.id);
      
      if (error) {
        console.error('❌ Error loading projects:', error);
        return;
      }
      
      console.log('✅ Projects loaded:', data);
      setProjects(data || []);
      
      // If no current project and we have projects, select the first one
      if (!currentProject && data && data.length > 0) {
        onProjectChange(data[0]);
      }
      
      // If no projects exist, create a default one
      if (!data || data.length === 0) {
        await createDefaultProject();
      }
    } catch (error) {
      console.error('❌ Error in loadProjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProject = async () => {
    if (!user) return;
    
    console.log('📝 Creating default project for user:', user.email);
    
    const defaultProject = {
      user_id: user.id,
      name: 'Healthcare Project',
      description: 'Default project for healthcare candidate sourcing',
      industry: 'Healthcare',
      status: 'active' as const,
      settings: {},
    };
    
    try {
      const { data, error } = await createProject(defaultProject);
      
      if (error) {
        console.error('❌ Error creating default project:', error);
        return;
      }
      
      console.log('✅ Default project created:', data);
      setProjects([data]);
      onProjectChange(data);
    } catch (error) {
      console.error('❌ Error in createDefaultProject:', error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectName.trim()) return;
    
    console.log('📝 Creating new project:', newProjectName);
    setCreating(true);
    
    try {
      const newProject = {
        user_id: user.id,
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
        industry: 'Healthcare',
        status: 'active' as const,
        settings: {},
      };
      
      const { data, error } = await createProject(newProject);
      
      if (error) {
        console.error('❌ Error creating project:', error);
        return;
      }
      
      console.log('✅ Project created:', data);
      setProjects(prev => [data, ...prev]);
      onProjectChange(data);
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
    } catch (error) {
      console.error('❌ Error in handleCreateProject:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <Folder className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Project Selector Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        <Building className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-900 flex-1 text-left">
          {currentProject?.name || 'Select Project'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Select Project</h3>
            <p className="text-xs text-gray-600">Choose a project to organize your searches and campaigns</p>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  onProjectChange(project);
                  setShowDropdown(false);
                }}
                className={`w-full flex items-start gap-3 px-3 py-3 hover:bg-gray-50 transition-colors ${
                  currentProject?.id === project.id ? 'bg-purple-50 border-r-2 border-purple-500' : ''
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-sm font-medium text-gray-900">{project.name}</h4>
                  {project.description && (
                    <p className="text-xs text-gray-600 mt-1">{project.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {project.industry}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={() => {
                setShowCreateModal(true);
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create New Project</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h2>
              
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Healthcare Recruitment Q1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Brief description of this project..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewProjectName('');
                      setNewProjectDescription('');
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newProjectName.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;