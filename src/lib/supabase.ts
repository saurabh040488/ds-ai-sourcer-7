import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  throw new Error('Missing Supabase environment variables');
}

console.log('✅ Supabase client initialized');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  company?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  industry?: string;
  status: 'active' | 'archived';
  settings?: any;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCandidate {
  id: string;
  project_id: string;
  name: string;
  email?: string;
  phone?: string;
  job_title: string;
  location: string;
  experience: number;
  skills: string[];
  industry?: string;
  education?: string;
  summary?: string;
  availability: 'available' | 'passive' | 'not-looking';
  source?: string;
  last_active: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface Search {
  id: string;
  user_id: string;
  project_id: string;
  query: string;
  extracted_entities?: any;
  filters?: any;
  results_count: number;
  results?: any;
  created_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  project_id: string;
  job_posting_id?: string;
  name: string;
  type: 'nurture' | 'enrichment' | 'keep-warm' | 'reengage';
  status: 'draft' | 'active' | 'paused' | 'completed';
  target_audience?: string;
  campaign_goal?: string;
  source_context?: string;
  content_sources?: any[];
  ai_instructions?: string;
  tone?: string;
  company_name?: string;
  recruiter_name?: string;
  settings?: any;
  stats?: any;
  created_at: string;
  updated_at: string;
}

export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_order: number;
  type: 'email' | 'connection';
  subject: string;
  content: string;
  delay: number;
  delay_unit: 'immediately' | 'business days';
  created_at: string;
}

interface Shortlist {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  description?: string;
  source_context?: string;
  created_at: string;
  updated_at: string;
}

// New types for enhanced flow
export interface JobPosting {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  salary_range?: string;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'temporary';
  company_name?: string;
  reference_number?: string;
  shift_timings?: string;
  apply_url: string;
  status: 'active' | 'paused' | 'closed';
  created_at: string;
  updated_at: string;
}

interface CampaignCandidate {
  id: string;
  campaign_id: string;
  candidate_id: string;
  source_type: 'search' | 'shortlist' | 'manual';
  source_context?: string;
  job_posting_id?: string;
  status: 'pending' | 'sent' | 'opened' | 'replied' | 'interested' | 'not-interested';
  notes?: string;
  added_at: string;
}

export interface CompanyProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_url: string;
  logo_url?: string;
  description?: string;
  industry?: string;
  size?: string;
  location?: string;
  values?: string[];
  benefits?: string[];
  culture_keywords?: string[];
  ai_extracted_data?: any;
  last_updated: string;
  created_at: string;
}

export interface CompanyCollateral {
  id: string;
  company_profile_id: string;
  type: 'newsletters' | 'benefits' | 'who_we_are' | 'mission_statements' | 'dei_statements' | 'talent_community_link' | 'career_site_link' | 'company_logo';
  content: string;
  links: string[];
  last_updated: string;
  version: string;
  created_at: string;
}

// Authentication helpers
export const signUp = async (email: string, password: string, fullName?: string) => {
  console.log('📝 Supabase: Attempting to sign up user:', email);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      console.error('❌ Supabase: Signup error:', error);
    } else {
      console.log('✅ Supabase: Signup successful:', data.user?.email);
    }
    
    return { data, error };
  } catch (err) {
    console.error('❌ Supabase: Signup exception:', err);
    return { data: null, error: err as any };
  }
};

export const signIn = async (email: string, password: string) => {
  console.log('🔐 Supabase: Attempting to sign in user:', email);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Supabase: Signin error:', error);
    } else {
      console.log('✅ Supabase: Signin successful:', data.user?.email);
    }
    
    return { data, error };
  } catch (err) {
    console.error('❌ Supabase: Signin exception:', err);
    return { data: null, error: err as any };
  }
};

export const getCurrentUser = async () => {
  console.log('👤 Supabase: Getting current user...');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Supabase: Get user error:', error);
    } else {
      console.log('✅ Supabase: Current user:', user?.email || 'No user');
    }
    
    return { user, error };
  } catch (err) {
    console.error('❌ Supabase: Get user exception:', err);
    return { user: null, error: err as any };
  }
};

// Profile helpers
export const getProfile = async (userId: string) => {
  console.log('👤 Supabase: Getting profile for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('❌ Supabase: Get profile error:', error);
    } else {
      console.log('✅ Supabase: Profile retrieved:', data?.email);
    }
    
    return { data, error };
  } catch (err) {
    console.error('❌ Supabase: Get profile exception:', err);
    return { data: null, error: err as any };
  }
};

export const createProfile = async (profile: Omit<Profile, 'created_at' | 'updated_at'>) => {
  console.log('📝 Supabase: Creating profile:', profile.email);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Supabase: Error creating profile:', error);
    } else {
      console.log('✅ Supabase: Profile created successfully:', data?.email);
    }
    
    return { data, error };
  } catch (err) {
    console.error('❌ Supabase: Create profile exception:', err);
    return { data: null, error: err as any };
  }
};

// Project helpers
export const getProjects = async (userId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();
  return { data, error };
};

// Candidate helpers
export const getCandidates = async (projectId: string) => {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const bulkCreateCandidates = async (candidates: Omit<DatabaseCandidate, 'id' | 'created_at' | 'updated_at'>[]) => {
  const { data, error } = await supabase
    .from('candidates')
    .insert(candidates)
    .select();
  return { data, error };
};

// Job Posting helpers
export const getJobPostings = async (userId: string, projectId?: string) => {
  let query = supabase
    .from('job_postings')
    .select('*')
    .eq('user_id', userId);
  
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  return { data, error };
};

export const createJobPosting = async (jobPosting: Omit<JobPosting, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('job_postings')
    .insert(jobPosting)
    .select()
    .single();
  return { data, error };
};

export const updateJobPosting = async (jobId: string, updates: Partial<JobPosting>) => {
  const { data, error } = await supabase
    .from('job_postings')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single();
  return { data, error };
};

// Company Profile helpers
export const getCompanyProfiles = async (userId: string) => {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createCompanyProfile = async (profile: Omit<CompanyProfile, 'id' | 'created_at' | 'last_updated'>) => {
  const { data, error } = await supabase
    .from('company_profiles')
    .insert(profile)
    .select()
    .single();
  return { data, error };
};

export const updateCompanyProfile = async (profileId: string, updates: Partial<CompanyProfile>) => {
  const { data, error } = await supabase
    .from('company_profiles')
    .update({
      ...updates,
      last_updated: new Date().toISOString()
    })
    .eq('id', profileId)
    .select()
    .single();
  return { data, error };
};

export const deleteCompanyProfile = async (profileId: string) => {
  const { error } = await supabase
    .from('company_profiles')
    .delete()
    .eq('id', profileId);
  return { error };
};

// Company Collateral helpers
export const getCompanyCollateral = async (companyProfileId: string) => {
  const { data, error } = await supabase
    .from('company_collateral')
    .select('*')
    .eq('company_profile_id', companyProfileId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createCompanyCollateral = async (collateral: Omit<CompanyCollateral, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('company_collateral')
    .insert(collateral)
    .select()
    .single();
  return { data, error };
};

export const updateCompanyCollateral = async (collateralId: string, updates: Partial<CompanyCollateral>) => {
  const { data, error } = await supabase
    .from('company_collateral')
    .update({
      ...updates,
      last_updated: new Date().toISOString()
    })
    .eq('id', collateralId)
    .select()
    .single();
  return { data, error };
};

export const deleteCompanyCollateral = async (collateralId: string) => {
  const { error } = await supabase
    .from('company_collateral')
    .delete()
    .eq('id', collateralId);
  return { error };
};

// Search helpers
export const saveSearch = async (search: Omit<Search, 'id' | 'created_at'>) => {
  console.log('💾 Supabase: Saving search:', search.query);
  
  try {
    const { data, error } = await supabase
      .from('searches')
      .insert(search)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Supabase: Error saving search:', error);
    } else {
      console.log('✅ Supabase: Search saved successfully');
    }
    
    return { data, error };
  } catch (err) {
    console.error('❌ Supabase: Save search exception:', err);
    return { data: null, error: err as any };
  }
};

export const getRecentSearches = async (userId: string, projectId: string, limit = 10) => {
  const { data, error } = await supabase
    .from('searches')
    .select('*')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
};

export const getSearchResults = async (query: string, projectId: string) => {
  console.log('🔍 Supabase: Getting search results for query:', query, 'project:', projectId);
  
  try {
    const { data, error } = await supabase
      .from('searches')
      .select('results, extracted_entities')
      .eq('query', query)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Supabase: Error getting search results:', error);
      return { data: null, error, extracted_entities: null };
    } 
    
    if (!data || data.length === 0) {
      console.log('⚠️ Supabase: No search results found for query:', query);
      return { data: null, error: { message: 'No results found' }, extracted_entities: null };
    }
    
    console.log('✅ Supabase: Search results retrieved successfully:', data.length);
    console.log('🔍 FILTER STATE DEBUG: Retrieved extracted_entities from database:', data[0].extracted_entities);
    
    // Return the results array from the first matching search along with extracted_entities
    return { 
      data: data[0].results, 
      error: null, 
      extracted_entities: data[0].extracted_entities 
    };
  } catch (err) {
    console.error('❌ Supabase: Get search results exception:', err);
    return { data: null, error: err as any, extracted_entities: null };
  }
};

// Campaign helpers
export const getCampaigns = async (userId: string, projectId?: string) => {
  console.log('📧 Supabase: Getting campaigns for user:', userId, 'project:', projectId);
  
  try {
    let query = supabase
      .from('campaigns')
      .select(`
        *,
        campaign_steps (*),
        campaign_candidates (*),
        job_postings (*)
      `)
      .eq('user_id', userId);
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase: Error getting campaigns:', error);
    } else {
      console.log('✅ Supabase: Campaigns retrieved:', data?.length || 0);
    }
    
    return { data, error };
  } catch (err) {
    console.error('❌ Supabase: Get campaigns exception:', err);
    return { data: null, error: err as any };
  }
};

export const createCampaign = async (
  campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>,
  steps: Omit<CampaignStep, 'id' | 'campaign_id' | 'created_at'>[],
  candidateIds?: string[],
  sourceContext?: { type: 'search' | 'shortlist' | 'manual'; context?: string; jobPostingId?: string }
) => {
  console.log('📧 Supabase: Creating campaign:', campaign.name);
  
  try {
    // Create the campaign first
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();

    if (campaignError) {
      console.error('❌ Supabase: Error creating campaign:', campaignError);
      return { data: null, error: campaignError };
    }

    console.log('✅ Supabase: Campaign created with ID:', campaignData.id);

    // Insert campaign steps
    const stepsWithCampaignId = steps.map((step, index) => ({
      ...step,
      campaign_id: campaignData.id,
      step_order: step.step_order || index + 1,
    }));

    const { data: stepsData, error: stepsError } = await supabase
      .from('campaign_steps')
      .insert(stepsWithCampaignId)
      .select();

    if (stepsError) {
      console.error('❌ Supabase: Error creating campaign steps:', stepsError);
      // Clean up campaign if steps failed
      await supabase.from('campaigns').delete().eq('id', campaignData.id);
      return { data: null, error: stepsError };
    }

    // Add candidates to campaign if provided
    if (candidateIds && candidateIds.length > 0 && sourceContext) {
      const campaignCandidates = candidateIds.map(candidateId => ({
        campaign_id: campaignData.id,
        candidate_id: candidateId,
        source_type: sourceContext.type,
        source_context: sourceContext.context,
        job_posting_id: sourceContext.jobPostingId,
        status: 'pending' as const,
      }));

      const { error: candidatesError } = await supabase
        .from('campaign_candidates')
        .insert(campaignCandidates);

      if (candidatesError) {
        console.error('❌ Supabase: Error adding candidates to campaign:', candidatesError);
        // Don't fail the entire operation, just log the error
      } else {
        console.log('✅ Supabase: Added candidates to campaign:', candidateIds.length);
      }
    }

    const result = { 
      ...campaignData, 
      campaign_steps: stepsData 
    };
    
    console.log('✅ Supabase: Campaign creation completed successfully');
    return { data: result, error: null };
    
  } catch (err) {
    console.error('❌ Supabase: Create campaign exception:', err);
    return { data: null, error: err as any };
  }
};

export const updateCampaign = async (
  campaignId: string,
  campaign: Partial<Campaign>,
  steps?: Omit<CampaignStep, 'id' | 'campaign_id' | 'created_at'>[]
) => {
  console.log('✏️ Supabase: Updating campaign:', campaignId);
  
  try {
    // Update campaign
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .update(campaign)
      .eq('id', campaignId)
      .select()
      .single();

    if (campaignError) {
      console.error('❌ Supabase: Error updating campaign:', campaignError);
      return { data: null, error: campaignError };
    }

    console.log('✅ Supabase: Campaign updated successfully');

    // Update steps if provided
    if (steps) {
      console.log('📝 Supabase: Updating campaign steps...');
      
      // Delete existing steps
      const { error: deleteError } = await supabase
        .from('campaign_steps')
        .delete()
        .eq('campaign_id', campaignId);
        
      if (deleteError) {
        console.error('❌ Supabase: Error deleting old steps:', deleteError);
        return { data: null, error: deleteError };
      }

      // Insert new steps
      const stepsWithCampaignId = steps.map((step, index) => ({
        ...step,
        campaign_id: campaignId,
        step_order: step.step_order || index + 1,
      }));

      const { data: stepsData, error: stepsError } = await supabase
        .from('campaign_steps')
        .insert(stepsWithCampaignId)
        .select();

      if (stepsError) {
        console.error('❌ Supabase: Error creating new steps:', stepsError);
        return { data: null, error: stepsError };
      }

      console.log('✅ Supabase: Campaign steps updated:', stepsData?.length || 0);

      return { 
        data: { 
          ...campaignData, 
          campaign_steps: stepsData 
        }, 
        error: null 
      };
    }

    return { data: campaignData, error: null };
    
  } catch (err) {
    console.error('❌ Supabase: Update campaign exception:', err);
    return { data: null, error: err as any };
  }
};

// New function to delete a campaign
export const deleteCampaign = async (campaignId: string) => {
  console.log('🗑️ Supabase: Deleting campaign:', campaignId);
  
  try {
    // First delete related campaign steps
    const { error: stepsError } = await supabase
      .from('campaign_steps')
      .delete()
      .eq('campaign_id', campaignId);
      
    if (stepsError) {
      console.error('❌ Supabase: Error deleting campaign steps:', stepsError);
      return { error: stepsError };
    }
    
    console.log('✅ Supabase: Campaign steps deleted successfully');
    
    // Then delete related campaign candidates
    const { error: candidatesError } = await supabase
      .from('campaign_candidates')
      .delete()
      .eq('campaign_id', campaignId);
      
    if (candidatesError) {
      console.error('❌ Supabase: Error deleting campaign candidates:', candidatesError);
      // Continue with campaign deletion even if this fails
    } else {
      console.log('✅ Supabase: Campaign candidates deleted successfully');
    }
    
    // Finally delete the campaign itself
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);
      
    if (error) {
      console.error('❌ Supabase: Error deleting campaign:', error);
      return { error };
    }
    
    console.log('✅ Supabase: Campaign deleted successfully');
    return { error: null };
    
  } catch (err) {
    console.error('❌ Supabase: Delete campaign exception:', err);
    return { error: err as any };
  }
};

// Campaign Candidate helpers
const addCandidatesToCampaign = async (
  campaignId: string,
  candidateIds: string[],
  sourceContext: { type: 'search' | 'shortlist' | 'manual'; context?: string; jobPostingId?: string }
) => {
  console.log('📧 Supabase: Adding candidates to campaign:', campaignId, candidateIds.length);
  
  try {
    const campaignCandidates = candidateIds.map(candidateId => ({
      campaign_id: campaignId,
      candidate_id: candidateId,
      source_type: sourceContext.type,
      source_context: sourceContext.context,
      job_posting_id: sourceContext.jobPostingId,
      status: 'pending' as const,
    }));

    const { data, error } = await supabase
      .from('campaign_candidates')
      .insert(campaignCandidates)
      .select();

    if (error) {
      console.error('❌ Supabase: Error adding candidates to campaign:', error);
    } else {
      console.log('✅ Supabase: Candidates added to campaign successfully');
    }

    return { data, error };
  } catch (err) {
    console.error('❌ Supabase: Add candidates to campaign exception:', err);
    return { data: null, error: err as any };
  }
};

const getCampaignCandidates = async (campaignId: string) => {
  const { data, error } = await supabase
    .from('campaign_candidates')
    .select(`
      *,
      candidates (*)
    `)
    .eq('campaign_id', campaignId)
    .order('added_at', { ascending: false });
  
  return { data, error };
};

const updateCampaignCandidateStatus = async (
  campaignCandidateId: string,
  status: CampaignCandidate['status'],
  notes?: string
) => {
  const { data, error } = await supabase
    .from('campaign_candidates')
    .update({ status, notes })
    .eq('id', campaignCandidateId)
    .select()
    .single();
  
  return { data, error };
};

// Shortlist helpers
export const getShortlists = async (userId: string, projectId: string) => {
  console.log('📋 Supabase: Getting shortlists for user:', userId, 'project:', projectId);
  
  try {
    const { data, error } = await supabase
      .from('shortlists')
      .select(`
        *,
        shortlist_candidates (
          *,
          candidates (*)
        )
      `)
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Supabase: Error getting shortlists:', error);
    } else {
      console.log('✅ Supabase: Shortlists retrieved:', data?.length || 0);
    }
    
    return { data, error };
  } catch (err) {
    console.error('❌ Supabase: Get shortlists exception:', err);
    return { data: null, error: err as any };
  }
};

export const createShortlist = async (shortlist: Omit<Shortlist, 'id' | 'created_at' | 'updated_at'>) => {
  console.log('📋 Supabase: Creating shortlist:', shortlist.name);
  
  try {
    const { data, error } = await supabase
      .from('shortlists')
      .insert(shortlist)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Supabase: Error creating shortlist:', error);
    } else {
      console.log('✅ Supabase: Shortlist created successfully');
    }
    
    return { data, error };
  } catch (err) {
    console.error('❌ Supabase: Create shortlist exception:', err);
    return { data: null, error: err as any };
  }
};

export const addCandidateToShortlist = async (shortlistId: string, candidateId: string, notes?: string) => {
  console.log('📋 Supabase: Adding candidate to shortlist:', candidateId, 'to', shortlistId);
  
  try {
    const { data, error } = await supabase
      .from('shortlist_candidates')
      .insert({
        shortlist_id: shortlistId,
        candidate_id: candidateId,
        notes,
      })
      .select()
      .single();
      
    if (error) {
      console.error('❌ Supabase: Error adding candidate to shortlist:', error);
    } else {
      console.log('✅ Supabase: Candidate added to shortlist successfully');
    }
    
    return { data, error };
  } catch (err) {
    console.error('❌ Supabase: Add candidate to shortlist exception:', err);
    return { data: null, error: err as any };
  }
};

export const bulkAddCandidatesToShortlist = async (shortlistId: string, candidateIds: string[], notes?: string) => {
  console.log('📋 Supabase: Bulk adding candidates to shortlist:', candidateIds.length, 'candidates to', shortlistId);
  
  try {
    const insertData = candidateIds.map(candidateId => ({
      shortlist_id: shortlistId,
      candidate_id: candidateId,
      notes,
    }));
    
    const { data, error } = await supabase
      .from('shortlist_candidates')
      .insert(insertData)
      .select();
      
    if (error) {
      console.error('❌ Supabase: Error bulk adding candidates to shortlist:', error);
    } else {
      console.log('✅ Supabase: Candidates bulk added to shortlist successfully:', data?.length || 0);
    }
    
    return { data, error };
  } catch (err) {
    console.error('❌ Supabase: Bulk add candidates to shortlist exception:', err);
    return { data: null, error: err as any };
  }
};