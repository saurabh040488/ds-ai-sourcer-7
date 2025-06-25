import React, { useState, useEffect, useContext } from 'react';
import { Plus, Building, Globe, Wand2, Edit, Trash2, Eye, Copy, Loader2, AlertCircle, CheckCircle, X, Link, FileText, Users, Target, Sparkles, Save, Upload } from 'lucide-react';
import { AuthContext } from './AuthWrapper';
import { 
  Project, 
  CompanyProfile, 
  CompanyCollateral,
  getCompanyProfiles, 
  createCompanyProfile, 
  updateCompanyProfile, 
  deleteCompanyProfile,
  getCompanyCollateral, 
  createCompanyCollateral, 
  updateCompanyCollateral, 
  deleteCompanyCollateral 
} from '../lib/supabase';
import { extractCompanyBranding, extractCompanyCollateral } from '../utils/companyBranding';
import Button from './shared/Button';
import LoadingSpinner from './shared/LoadingSpinner';
import Badge from './shared/Badge';

interface CompanyBrandingViewProps {
  currentProject?: Project | null;
}

interface CollateralFormData {
  type: 'newsletters' | 'benefits' | 'who_we_are' | 'mission_statements' | 'dei_statements' | 'talent_community_link' | 'career_site_link' | 'company_logo';
  content: string;
  links: string[];
  mainSiteUrl?: string;
  careerSiteUrl?: string;
}

const CompanyBrandingView: React.FC<CompanyBrandingViewProps> = ({ currentProject }) => {
  const { user } = useContext(AuthContext);
  
  // State management
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [selectedCompanyProfileId, setSelectedCompanyProfileId] = useState<string | null>(null);
  const [currentCompanyProfile, setCurrentCompanyProfile] = useState<CompanyProfile | null>(null);
  const [companyCollateral, setCompanyCollateral] = useState<CompanyCollateral[]>([]);
  
  // Loading states
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingCollateral, setLoadingCollateral] = useState(false);
  const [extractingCollateral, setExtractingCollateral] = useState(false);
  const [savingCollateral, setSavingCollateral] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  
  // Error states
  const [extractionError, setExtractionError] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');
  const [profileError, setProfileError] = useState<string>('');
  
  // Modal states
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [showCollateralModal, setShowCollateralModal] = useState(false);
  
  // Form states
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileUrl, setNewProfileUrl] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');
  
  const [collateralForm, setCollateralForm] = useState<CollateralFormData>({
    type: 'who_we_are',
    content: '',
    links: [],
    mainSiteUrl: '',
    careerSiteUrl: ''
  });
  
  const [extractedCollateralPreview, setExtractedCollateralPreview] = useState<CompanyCollateral[]>([]);
  const [editingCollateral, setEditingCollateral] = useState<CompanyCollateral | null>(null);

  // Load company profiles on mount
  useEffect(() => {
    if (user && currentProject) {
      loadCompanyProfiles();
    }
  }, [user, currentProject]);

  // Load collateral when company profile changes
  useEffect(() => {
    if (currentCompanyProfile) {
      loadCompanyCollateral();
    } else {
      setCompanyCollateral([]);
    }
  }, [currentCompanyProfile]);

  // Update current company profile when selection changes
  useEffect(() => {
    if (selectedCompanyProfileId) {
      const profile = companyProfiles.find(p => p.id === selectedCompanyProfileId);
      setCurrentCompanyProfile(profile || null);
    } else {
      setCurrentCompanyProfile(null);
    }
  }, [selectedCompanyProfileId, companyProfiles]);

  const loadCompanyProfiles = async () => {
    if (!user) return;

    console.log('🏢 Loading company profiles...');
    setLoadingProfiles(true);
    setProfileError('');

    try {
      const { data, error } = await getCompanyProfiles(user.id);
      
      if (error) {
        console.error('❌ Error loading company profiles:', error);
        setProfileError(error.message);
        return;
      }

      console.log('✅ Company profiles loaded:', data?.length || 0);
      setCompanyProfiles(data || []);
      
      // Auto-select first profile if none selected
      if (data && data.length > 0 && !selectedCompanyProfileId) {
        setSelectedCompanyProfileId(data[0].id);
      }
    } catch (error) {
      console.error('❌ Error in loadCompanyProfiles:', error);
      setProfileError('Failed to load company profiles');
    } finally {
      setLoadingProfiles(false);
    }
  };

  const loadCompanyCollateral = async () => {
    if (!currentCompanyProfile) return;

    console.log('📚 Loading collateral for:', currentCompanyProfile.company_name);
    setLoadingCollateral(true);

    try {
      const { data, error } = await getCompanyCollateral(currentCompanyProfile.id);
      
      if (error) {
        console.error('❌ Error loading collateral:', error);
        return;
      }

      console.log('✅ Collateral loaded:', data?.length || 0);
      setCompanyCollateral(data || []);
    } catch (error) {
      console.error('❌ Error in loadCompanyCollateral:', error);
    } finally {
      setLoadingCollateral(false);
    }
  };

  const handleCreateCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProfileName.trim() || !newProfileUrl.trim()) return;

    console.log('📝 Creating company profile:', newProfileName);
    setCreatingProfile(true);
    setProfileError('');

    try {
      // Extract branding data using AI
      const brandingData = await extractCompanyBranding(newProfileUrl);
      
      const profileData = {
        user_id: user.id,
        company_name: newProfileName.trim(),
        company_url: newProfileUrl.trim(),
        description: newProfileDescription.trim() || brandingData.description,
        industry: brandingData.industry,
        size: brandingData.size,
        location: brandingData.location,
        values: brandingData.values,
        benefits: brandingData.benefits,
        culture_keywords: brandingData.cultureKeywords,
        logo_url: brandingData.logoUrl,
        ai_extracted_data: brandingData,
        last_updated: new Date().toISOString()
      };

      const { data, error } = await createCompanyProfile(profileData);
      
      if (error) {
        console.error('❌ Error creating profile:', error);
        setProfileError(error.message);
        return;
      }

      console.log('✅ Company profile created successfully');
      setCompanyProfiles(prev => [data, ...prev]);
      setSelectedCompanyProfileId(data.id);
      setShowCreateProfileModal(false);
      setNewProfileName('');
      setNewProfileUrl('');
      setNewProfileDescription('');
    } catch (error) {
      console.error('❌ Error in handleCreateCompanyProfile:', error);
      setProfileError('Failed to create company profile');
    } finally {
      setCreatingProfile(false);
    }
  };

  const handleExtractCollateral = async () => {
    if (!collateralForm.mainSiteUrl.trim()) {
      setExtractionError('Please enter a main site URL');
      return;
    }

    console.log('🤖 Extracting collateral from:', collateralForm.mainSiteUrl);
    setExtractingCollateral(true);
    setExtractionError('');
    setExtractedCollateralPreview([]);

    try {
      const extractedData = await extractCompanyCollateral(
        collateralForm.mainSiteUrl,
        collateralForm.careerSiteUrl || undefined
      );
      
      console.log('✅ Collateral extracted successfully:', extractedData.length);
      setExtractedCollateralPreview(extractedData);
    } catch (error) {
      console.error('❌ Error extracting collateral:', error);
      setExtractionError('Failed to extract collateral. Please try manual entry.');
    } finally {
      setExtractingCollateral(false);
    }
  };

  const handleSaveCollateral = async (collateralData: Omit<CompanyCollateral, 'id' | 'created_at'>) => {
    if (!currentCompanyProfile) return;

    console.log('💾 Saving collateral:', collateralData.type);
    setSavingCollateral(true);
    setSaveError('');

    try {
      if (editingCollateral) {
        const { data, error } = await updateCompanyCollateral(editingCollateral.id, collateralData);
        
        if (error) {
          console.error('❌ Error updating collateral:', error);
          setSaveError(error.message);
          return;
        }

        setCompanyCollateral(prev => prev.map(item => 
          item.id === editingCollateral.id ? data : item
        ));
        console.log('✅ Collateral updated successfully');
      } else {
        const { data, error } = await createCompanyCollateral({
          ...collateralData,
          company_profile_id: currentCompanyProfile.id
        });
        
        if (error) {
          console.error('❌ Error creating collateral:', error);
          setSaveError(error.message);
          return;
        }

        setCompanyCollateral(prev => [data, ...prev]);
        console.log('✅ Collateral created successfully');
      }

      setShowCollateralModal(false);
      setEditingCollateral(null);
      resetCollateralForm();
    } catch (error) {
      console.error('❌ Error in handleSaveCollateral:', error);
      setSaveError('Failed to save collateral');
    } finally {
      setSavingCollateral(false);
    }
  };

  const handleDeleteCollateral = async (collateralId: string) => {
    if (!confirm('Are you sure you want to delete this collateral item?')) return;

    console.log('🗑️ Deleting collateral:', collateralId);

    try {
      const { error } = await deleteCompanyCollateral(collateralId);
      
      if (error) {
        console.error('❌ Error deleting collateral:', error);
        return;
      }

      setCompanyCollateral(prev => prev.filter(item => item.id !== collateralId));
      console.log('✅ Collateral deleted successfully');
    } catch (error) {
      console.error('❌ Error in handleDeleteCollateral:', error);
    }
  };

  const resetCollateralForm = () => {
    setCollateralForm({
      type: 'who_we_are',
      content: '',
      links: [],
      mainSiteUrl: '',
      careerSiteUrl: ''
    });
    setExtractedCollateralPreview([]);
    setExtractionError('');
    setSaveError('');
  };

  const openCollateralModal = (collateral?: CompanyCollateral) => {
    if (collateral) {
      setEditingCollateral(collateral);
      setCollateralForm({
        type: collateral.type,
        content: collateral.content,
        links: collateral.links,
        mainSiteUrl: '',
        careerSiteUrl: ''
      });
    } else {
      setEditingCollateral(null);
      resetCollateralForm();
    }
    setShowCollateralModal(true);
  };

  const getCollateralTypeIcon = (type: string) => {
    const icons = {
      newsletters: FileText,
      benefits: Target,
      who_we_are: Users,
      mission_statements: Sparkles,
      dei_statements: Users,
      talent_community_link: Link,
      career_site_link: Link,
      company_logo: Building
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  const getCollateralTypeBadge = (type: string) => {
    const badges = {
      newsletters: { variant: 'info' as const, label: 'Newsletter' },
      benefits: { variant: 'success' as const, label: 'Benefits' },
      who_we_are: { variant: 'default' as const, label: 'About Us' },
      mission_statements: { variant: 'info' as const, label: 'Mission' },
      dei_statements: { variant: 'success' as const, label: 'DEI' },
      talent_community_link: { variant: 'warning' as const, label: 'Community Link' },
      career_site_link: { variant: 'warning' as const, label: 'Career Link' },
      company_logo: { variant: 'default' as const, label: 'Logo' }
    };
    
    const badge = badges[type as keyof typeof badges] || { variant: 'default' as const, label: type };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Project Selected</h3>
          <p className="text-gray-600">Please select a project to manage company branding.</p>
        </div>
      </div>
    );
  }

  if (loadingProfiles) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading company profiles..." />
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
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Company Branding</h1>
              <p className="text-sm text-gray-600">
                Manage company profiles and extract collateral for {currentProject.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowCreateProfileModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Company
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Company Profile Selection */}
          {companyProfiles.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Company Profiles</h3>
                <p className="text-sm text-gray-600 mt-1">Select a company to manage its collateral</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companyProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedCompanyProfileId(profile.id)}
                      className={`p-4 text-left border-2 rounded-xl transition-all duration-200 ${
                        selectedCompanyProfileId === profile.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {profile.company_name}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            {profile.company_url}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="default" size="sm">{profile.industry}</Badge>
                            <Badge variant="info" size="sm">{profile.size}</Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Collateral Management */}
          {currentCompanyProfile && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Collateral for {currentCompanyProfile.company_name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Extract or manually add company collateral for campaigns
                    </p>
                  </div>
                  <Button
                    onClick={() => openCollateralModal()}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Add Collateral
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {loadingCollateral ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner text="Loading collateral..." />
                  </div>
                ) : companyCollateral.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Collateral Yet</h4>
                    <p className="text-gray-600 mb-6">
                      Extract collateral from company websites or add manually
                    </p>
                    <Button
                      onClick={() => openCollateralModal()}
                      icon={<Wand2 className="w-4 h-4" />}
                    >
                      Extract with AI
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companyCollateral.map((item) => {
                      const Icon = getCollateralTypeIcon(item.type);
                      return (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-gray-500" />
                              {getCollateralTypeBadge(item.type)}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openCollateralModal(item)}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCollateral(item.id)}
                                className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm text-gray-700 line-clamp-3">
                              {item.content}
                            </p>
                            
                            {item.links.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Link className="w-3 h-3" />
                                <span>{item.links.length} link{item.links.length > 1 ? 's' : ''}</span>
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-500">
                              Updated {new Date(item.last_updated).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {companyProfiles.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Building className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No Company Profiles Yet
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create your first company profile to start extracting and managing collateral for campaigns.
              </p>
              <Button
                onClick={() => setShowCreateProfileModal(true)}
                icon={<Plus className="w-5 h-5" />}
                size="lg"
              >
                Add Company Profile
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Company Profile Modal */}
      {showCreateProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Company Profile</h3>
              <button
                onClick={() => setShowCreateProfileModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCompanyProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., HCA Healthcare"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={newProfileUrl}
                    onChange={(e) => setNewProfileUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://company.com"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  We'll use AI to extract company information from this URL
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newProfileDescription}
                  onChange={(e) => setNewProfileDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Brief description of the company..."
                />
              </div>
              
              {profileError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{profileError}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateProfileModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={creatingProfile}
                  disabled={!newProfileName.trim() || !newProfileUrl.trim() || creatingProfile}
                  icon={<Wand2 className="w-4 h-4" />}
                >
                  {creatingProfile ? 'Creating...' : 'Create with AI'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collateral Modal */}
      {showCollateralModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCollateral ? 'Edit Collateral' : 'Add Company Collateral'}
              </h3>
              <button
                onClick={() => {
                  setShowCollateralModal(false);
                  setEditingCollateral(null);
                  resetCollateralForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* AI Extraction Section */}
              {!editingCollateral && (
                <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Extract Collateral with AI
                  </h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Enter company website URLs and we'll automatically extract collateral for your campaigns.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Main Website URL *
                      </label>
                      <input
                        type="url"
                        value={collateralForm.mainSiteUrl}
                        onChange={(e) => setCollateralForm(prev => ({ ...prev, mainSiteUrl: e.target.value }))}
                        placeholder="https://company.com"
                        className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Career Site URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={collateralForm.careerSiteUrl}
                        onChange={(e) => setCollateralForm(prev => ({ ...prev, careerSiteUrl: e.target.value }))}
                        placeholder="https://company.com/careers"
                        className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <Button
                      onClick={handleExtractCollateral}
                      loading={extractingCollateral}
                      disabled={!collateralForm.mainSiteUrl.trim() || extractingCollateral}
                      icon={<Wand2 className="w-4 h-4" />}
                      className="w-full"
                    >
                      {extractingCollateral ? 'Extracting...' : 'Extract Collateral with AI'}
                    </Button>
                    
                    {extractionError && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-700">
                          <p className="font-medium mb-1">Extraction Failed</p>
                          <p>{extractionError}</p>
                        </div>
                      </div>
                    )}
                    
                    {extractingCollateral && (
                      <div className="flex items-center gap-3 p-4 bg-white border border-blue-200 rounded-lg">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">Extracting collateral...</p>
                          <p className="text-gray-600">This may take a few seconds</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extracted Collateral Preview */}
              {extractedCollateralPreview.length > 0 && (
                <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Extracted Collateral
                    </h4>
                    <span className="text-sm text-green-700">
                      {extractedCollateralPreview.length} items found
                    </span>
                  </div>
                  
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {extractedCollateralPreview.map((item, index) => {
                      const Icon = getCollateralTypeIcon(item.type);
                      return (
                        <div key={index} className="bg-white border border-green-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-green-600" />
                              {getCollateralTypeBadge(item.type)}
                            </div>
                            <button
                              onClick={() => {
                                setCollateralForm({
                                  type: item.type,
                                  content: item.content,
                                  links: item.links,
                                  mainSiteUrl: collateralForm.mainSiteUrl,
                                  careerSiteUrl: collateralForm.careerSiteUrl
                                });
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Use This
                            </button>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {item.content}
                          </p>
                          {item.links.length > 0 && (
                            <div className="mt-2 text-xs text-blue-600">
                              {item.links.length} link{item.links.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => {
                        // Save all extracted collateral
                        extractedCollateralPreview.forEach(async (item) => {
                          if (!currentCompanyProfile) return;
                          
                          try {
                            await createCompanyCollateral({
                              company_profile_id: currentCompanyProfile.id,
                              type: item.type,
                              content: item.content,
                              links: item.links,
                              last_updated: new Date().toISOString(),
                              version: '1.0'
                            });
                          } catch (error) {
                            console.error('❌ Error saving extracted collateral:', error);
                          }
                        });
                        
                        // Reload collateral
                        loadCompanyCollateral();
                        setShowCollateralModal(false);
                        resetCollateralForm();
                      }}
                      icon={<Save className="w-4 h-4" />}
                    >
                      Save All Extracted Items
                    </Button>
                  </div>
                </div>
              )}

              {/* Manual Collateral Form */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  {editingCollateral ? 'Edit Collateral Details' : 'Manual Collateral Entry'}
                </h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collateral Type
                  </label>
                  <select
                    value={collateralForm.type}
                    onChange={(e) => setCollateralForm(prev => ({ 
                      ...prev, 
                      type: e.target.value as CollateralFormData['type']
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="who_we_are">About Us / Who We Are</option>
                    <option value="mission_statements">Mission & Values</option>
                    <option value="benefits">Benefits</option>
                    <option value="dei_statements">DEI Statements</option>
                    <option value="newsletters">Newsletters</option>
                    <option value="talent_community_link">Talent Community Link</option>
                    <option value="career_site_link">Career Site Link</option>
                    <option value="company_logo">Company Logo</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={collateralForm.content}
                    onChange={(e) => setCollateralForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter content or URL depending on collateral type..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For link types (talent_community_link, career_site_link, company_logo), enter the URL here
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Links (Optional)
                  </label>
                  <div className="space-y-2">
                    {collateralForm.links.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => {
                            const newLinks = [...collateralForm.links];
                            newLinks[index] = e.target.value;
                            setCollateralForm(prev => ({ ...prev, links: newLinks }));
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://example.com"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newLinks = collateralForm.links.filter((_, i) => i !== index);
                            setCollateralForm(prev => ({ ...prev, links: newLinks }));
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setCollateralForm(prev => ({ 
                          ...prev, 
                          links: [...prev.links, ''] 
                        }));
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Link
                    </button>
                  </div>
                </div>
                
                {saveError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{saveError}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-200 p-6">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCollateralModal(false);
                    setEditingCollateral(null);
                    resetCollateralForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!currentCompanyProfile) return;
                    
                    const collateralData = {
                      company_profile_id: currentCompanyProfile.id,
                      type: collateralForm.type,
                      content: collateralForm.content,
                      links: collateralForm.links.filter(link => link.trim()),
                      last_updated: new Date().toISOString(),
                      version: '1.0'
                    };
                    
                    handleSaveCollateral(collateralData);
                  }}
                  loading={savingCollateral}
                  disabled={!collateralForm.content.trim() || savingCollateral}
                  icon={<Save className="w-4 h-4" />}
                >
                  {editingCollateral ? 'Update Collateral' : 'Save Collateral'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyBrandingView;