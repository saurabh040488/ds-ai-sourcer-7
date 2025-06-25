export interface Candidate {
  id: string;
  name: string;
  jobTitle: string;
  location: string;
  experience: number;
  skills: string[];
  industry: string;
  education: string;
  email: string;
  phone: string;
  summary: string;
  lastActive: string;
  source: string;
  availability: 'available' | 'passive' | 'not-looking';
}

export interface SearchQuery {
  originalQuery: string;
  extractedEntities: {
    jobTitles: string[];
    locations: string[];
    experienceRange: {
      min?: number;
      max?: number;
    };
    skills: string[];
    industries: string[];
    education?: string;
  };
}

export interface MatchExplanation {
  score: number;
  reasons: string[];
  category: 'excellent' | 'good' | 'potential';
}

export interface CandidateMatch {
  candidate: Candidate;
  explanation: MatchExplanation;
}

// New types for enhanced campaign flow
interface JobPosting {
  id: string;
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
  source_context?: string; // Original search query or shortlist name
  job_posting_id?: string;
  status: 'pending' | 'sent' | 'opened' | 'replied' | 'interested' | 'not-interested';
  notes?: string;
  added_at: string;
}

interface EnhancedCampaign {
  id: string;
  user_id: string;
  project_id: string;
  job_posting_id?: string;
  name: string;
  type: 'nurture' | 'enrichment' | 'keep-warm' | 'reengage';
  status: 'draft' | 'active' | 'paused' | 'completed';
  target_audience?: string;
  campaign_goal?: string;
  source_context?: string; // Original search query that led to this campaign
  content_sources?: any[];
  ai_instructions?: string;
  tone?: string;
  company_name?: string;
  recruiter_name?: string;
  settings?: any;
  stats?: {
    sent: number;
    opened: number;
    replied: number;
    interested: number;
  };
  candidates?: CampaignCandidate[];
  created_at: string;
  updated_at: string;
}

// Beta Campaign Assistant Types
export interface CampaignExample {
  id: string; // Unique identifier for classification
  campaignGoal: string;
  campaignType: 'nurture' | 'enrichment' | 'keep-warm' | 'reengage' | 'nurture-reengage';
  sequenceAndExamples: {
    steps: number;
    duration: number;
    description: string;
    examples: string[];
  };
  collateralToUse: string[];
}

export interface AssistantMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  campaignDraft?: Partial<CampaignDraft>;
}

// Import CompanyCollateral type
import { CompanyCollateral } from '../lib/supabase';

export interface CampaignDraft {
  goal: string;
  type: 'nurture' | 'enrichment' | 'keep-warm' | 'reengage' | 'nurture-reengage';
  targetAudience: string;
  tone: string;
  emailLength?: 'short' | 'concise' | 'medium' | 'long';
  companyName: string;
  recruiterName: string;
  additionalContext: string;
  selectedCollateral: string[];
  sequenceStructure: {
    steps: number;
    duration: number;
    examples: string[];
  };
  matchedExampleId?: string; // ID of the matched CampaignExample
  relevantCompanyCollateral?: CompanyCollateral[]; // Actual collateral data relevant to the campaign
}