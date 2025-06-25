import React, { useState, useEffect, useContext } from 'react';
import { Plus, Briefcase, MapPin, DollarSign, Clock, Link, Edit, Trash2, Eye, Copy, Play, Pause, Search, Filter } from 'lucide-react';
import { AuthContext } from './AuthWrapper';
import { Project, JobPosting, getJobPostings, updateJobPosting } from '../lib/supabase';
import JobPostingModal from './JobPostingModal';
import Button from './shared/Button';
import LoadingSpinner from './shared/LoadingSpinner';
import Badge from './shared/Badge';

interface JobPostingsViewProps {
  currentProject?: Project | null;
}

const JobPostingsView: React.FC<JobPostingsViewProps> = ({ currentProject }) => {
  const { user } = useContext(AuthContext);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user && currentProject) {
      loadJobPostings();
    }
  }, [user, currentProject]);

  const loadJobPostings = async () => {
    if (!user || !currentProject) return;

    console.log('💼 Loading job postings for project:', currentProject.name);
    setLoading(true);

    try {
      const { data, error } = await getJobPostings(user.id, currentProject.id);
      
      if (error) {
        console.error('❌ Error loading job postings:', error);
        return;
      }

      console.log('✅ Job postings loaded:', data?.length || 0);
      setJobPostings(data || []);
    } catch (error) {
      console.error('❌ Error in loadJobPostings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = (jobPosting: JobPosting) => {
    setJobPostings(prev => [jobPosting, ...prev]);
    setShowJobModal(false);
    setEditingJob(null);
  };

  const handleJobUpdated = (updatedJob: JobPosting) => {
    setJobPostings(prev => prev.map(job => 
      job.id === updatedJob.id ? updatedJob : job
    ));
    setShowJobModal(false);
    setEditingJob(null);
  };

  const handleEditJob = (job: JobPosting) => {
    setEditingJob(job);
    setShowJobModal(true);
  };

  const handleToggleStatus = async (job: JobPosting) => {
    const newStatus = job.status === 'active' ? 'paused' : 'active';
    
    try {
      const { data, error } = await updateJobPosting(job.id, { status: newStatus });
      
      if (error) {
        console.error('❌ Error updating job status:', error);
        return;
      }

      setJobPostings(prev => prev.map(j => 
        j.id === job.id ? { ...j, status: newStatus } : j
      ));
      
      console.log('✅ Job status updated:', job.title, '→', newStatus);
    } catch (error) {
      console.error('❌ Error toggling job status:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    
    try {
      // TODO: Implement delete functionality
      console.log('🗑️ Deleting job posting:', jobId);
      alert('Delete functionality will be implemented soon!');
    } catch (error) {
      console.error('❌ Error deleting job posting:', error);
    }
  };

  const handleCopyApplyUrl = (applyUrl: string) => {
    navigator.clipboard.writeText(applyUrl);
    // TODO: Show toast notification
    console.log('📋 Apply URL copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'paused':
        return <Badge variant="warning">Paused</Badge>;
      case 'closed':
        return <Badge variant="error">Closed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getEmploymentTypeBadge = (type: string) => {
    const colors = {
      'full-time': 'bg-blue-100 text-blue-800',
      'part-time': 'bg-green-100 text-green-800',
      'contract': 'bg-orange-100 text-orange-800',
      'temporary': 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
      </span>
    );
  };

  const filteredJobPostings = jobPostings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Project Selected</h3>
          <p className="text-gray-600">Please select a project to manage job postings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading job postings..." />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Job Postings</h1>
              <p className="text-sm text-gray-600">
                Manage job postings for {currentProject.name}
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingJob(null);
              setShowJobModal(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Job Posting
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search job postings..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredJobPostings.length} of {jobPostings.length} jobs
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {filteredJobPostings.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {jobPostings.length === 0 ? 'No Job Postings Yet' : 'No Matching Job Postings'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {jobPostings.length === 0 
                  ? 'Create your first job posting to start sourcing candidates for specific roles.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {jobPostings.length === 0 && (
                <Button
                  onClick={() => {
                    setEditingJob(null);
                    setShowJobModal(true);
                  }}
                  icon={<Plus className="w-5 h-5" />}
                  size="lg"
                >
                  Create First Job Posting
                </Button>
              )}
            </div>
          ) : (
            /* Job Postings Grid */
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredJobPostings.map((job) => (
                <div key={job.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  {/* Job Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(job.status)}
                          {getEmploymentTypeBadge(job.employment_type)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-3">
                        <button
                          onClick={() => handleEditJob(job)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Job"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(job)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            job.status === 'active' 
                              ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50' 
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={job.status === 'active' ? 'Pause Job' : 'Activate Job'}
                        >
                          {job.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="p-6">
                    <div className="space-y-3 mb-4">
                      {job.salary_range && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          {job.salary_range}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        Created {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-3 mb-4">
                      {job.description}
                    </p>

                    {job.requirements && job.requirements.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Key Requirements
                        </h5>
                        <div className="space-y-1">
                          {job.requirements.slice(0, 3).map((req, index) => (
                            <div key={index} className="text-xs text-gray-600 flex items-start gap-1">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                              <span className="line-clamp-1">{req}</span>
                            </div>
                          ))}
                          {job.requirements.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{job.requirements.length - 3} more requirements
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Apply URL */}
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 truncate flex-1">
                        {job.apply_url}
                      </span>
                      <button
                        onClick={() => handleCopyApplyUrl(job.apply_url)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy Apply URL"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Open Apply URL"
                      >
                        <Eye className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Posting Modal */}
      <JobPostingModal
        isOpen={showJobModal}
        onClose={() => {
          setShowJobModal(false);
          setEditingJob(null);
        }}
        onSuccess={editingJob ? handleJobUpdated : handleJobCreated}
        currentProject={currentProject}
        editingJob={editingJob}
      />
    </div>
  );
};

export default JobPostingsView;