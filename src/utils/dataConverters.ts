import { Candidate } from '../types';
import { DatabaseCandidate } from '../lib/supabase';

/**
 * Converts a DatabaseCandidate (snake_case) to a Candidate (camelCase)
 */
function convertDatabaseCandidateToCandidate(dbCandidate: DatabaseCandidate): Candidate {
  if (!dbCandidate) {
    console.warn('⚠️ Invalid database candidate:', dbCandidate);
    return {
      id: 'unknown',
      name: 'Unknown',
      jobTitle: 'Unknown',
      location: 'Unknown',
      experience: 0,
      skills: [],
      industry: 'Healthcare',
      education: 'Unknown',
      email: '',
      phone: '',
      summary: '',
      lastActive: new Date().toISOString(),
      source: 'Unknown',
      availability: 'passive'
    };
  }

  return {
    id: dbCandidate.id || 'unknown',
    name: dbCandidate.name || 'Unknown',
    jobTitle: dbCandidate.job_title || 'Unknown',
    location: dbCandidate.location || 'Unknown',
    experience: dbCandidate.experience || 0,
    skills: dbCandidate.skills || [],
    industry: dbCandidate.industry || 'Healthcare',
    education: dbCandidate.education || 'Unknown',
    email: dbCandidate.email || '',
    phone: dbCandidate.phone || '',
    summary: dbCandidate.summary || '',
    lastActive: dbCandidate.last_active || new Date().toISOString(),
    source: dbCandidate.source || 'Unknown',
    availability: dbCandidate.availability || 'passive'
  };
}

/**
 * Converts an array of DatabaseCandidates to Candidates
 */
export function convertDatabaseCandidatesToCandidates(dbCandidates: DatabaseCandidate[]): Candidate[] {
  if (!Array.isArray(dbCandidates)) {
    console.warn('⚠️ Invalid database candidates array:', dbCandidates);
    return [];
  }

  return dbCandidates.map(convertDatabaseCandidateToCandidate);
}

/**
 * Converts a Candidate (camelCase) to a DatabaseCandidate (snake_case) for saving
 */
function convertCandidateToDatabaseCandidate(candidate: Candidate, projectId: string): Omit<DatabaseCandidate, 'id' | 'created_at' | 'updated_at'> {
  return {
    project_id: projectId,
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    job_title: candidate.jobTitle,
    location: candidate.location,
    experience: candidate.experience,
    skills: candidate.skills,
    industry: candidate.industry,
    education: candidate.education,
    summary: candidate.summary,
    availability: candidate.availability,
    source: candidate.source,
    last_active: candidate.lastActive,
    metadata: {}
  };
}