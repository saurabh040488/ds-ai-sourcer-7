import { Candidate, SearchQuery, CandidateMatch, MatchExplanation } from '../types';
import OpenAI from 'openai';
import { getAIModelForTask, getPromptForTask } from '../config/ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Logging utility
const logAIInteraction = (operation: string, prompt: string, response: string, metadata?: any) => {
  console.group(`🤖 AI ${operation}`);
  console.log('📤 PROMPT SENT:', prompt);
  console.log('📥 RESPONSE RECEIVED:', response);
  if (metadata) {
    console.log('📊 METADATA:', metadata);
  }
  console.groupEnd();
};

const logError = (operation: string, error: any, context?: any) => {
  console.group(`❌ ERROR in ${operation}`);
  console.error('Error:', error);
  if (context) {
    console.log('Context:', context);
  }
  console.groupEnd();
};

// Utility function to clean OpenAI API response from markdown code blocks
const cleanJSONResponse = (response: string): string => {
  if (!response || typeof response !== 'string') {
    return response;
  }
  
  // Remove markdown code block delimiters
  return response
    .replace(/^```json\s*/i, '') // Remove opening ```json
    .replace(/^```\s*/i, '')     // Remove opening ```
    .replace(/\s*```\s*$/i, '')  // Remove closing ```
    .trim();                     // Remove any surrounding whitespace
};

export async function expandJobTitles(jobTitle: string): Promise<string[]> {
  if (!jobTitle || typeof jobTitle !== 'string') {
    console.error('❌ Invalid job title for expansion:', jobTitle);
    return [jobTitle || 'Unknown'];
  }

  console.log('🔍 Starting AI job title expansion for:', jobTitle);
  
  // Get AI configuration for job title expansion
  const modelConfig = getAIModelForTask('jobTitleExpansion');
  const promptConfig = getPromptForTask('jobTitleExpansion');

  try {
    console.log('📤 Sending job title expansion request to OpenAI...');
    console.log('🔧 Using model:', modelConfig.model);
    
    const completion = await openai.chat.completions.create({
      model: modelConfig.model,
      messages: [
        {
          role: "system",
          content: promptConfig.system
        },
        {
          role: "user",
          content: jobTitle
        }
      ],
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Log the AI interaction
    logAIInteraction('Job Title Expansion', 
      `System: ${promptConfig.system}\n\nUser: ${jobTitle}`, 
      response,
      {
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        usage: completion.usage,
        originalTitle: jobTitle
      }
    );

    const expandedTitles = JSON.parse(cleanJSONResponse(response));
    
    if (!Array.isArray(expandedTitles)) {
      throw new Error('Response is not an array');
    }

    console.log('✅ Job title expansion successful:', expandedTitles);
    return expandedTitles;
    
  } catch (error) {
    logError('Job Title Expansion', error, { jobTitle });
    
    console.log('🔄 Falling back to basic expansion...');
    // Fallback to basic expansion
    const fallbackResult = basicJobTitleExpansion(jobTitle);
    console.log('🔄 Fallback expansion result:', fallbackResult);
    return fallbackResult;
  }
}

function basicJobTitleExpansion(jobTitle: string): string[] {
  if (!jobTitle || typeof jobTitle !== 'string') {
    console.warn('⚠️ Invalid job title for basic expansion:', jobTitle);
    return ['Unknown'];
  }

  console.log('🔄 Using basic job title expansion for:', jobTitle);
  
  const lowerTitle = jobTitle.toLowerCase();
  const expansions: { [key: string]: string[] } = {
    'registered nurse': ['Registered Nurse', 'RN', 'Staff Nurse', 'Bedside Nurse', 'Clinical Nurse', 'Floor Nurse'],
    'rn': ['Registered Nurse', 'RN', 'Staff Nurse', 'Clinical Nurse'],
    'nurse practitioner': ['Nurse Practitioner', 'NP', 'Advanced Practice Nurse', 'APRN', 'Family Nurse Practitioner'],
    'emergency room nurse': ['Emergency Room Nurse', 'ER Nurse', 'Emergency Nurse', 'Emergency Department Nurse', 'Trauma Nurse'],
    'clinical nurse specialist': ['Clinical Nurse Specialist', 'CNS', 'Advanced Practice Nurse', 'Specialist Nurse'],
    'licensed practical nurse': ['Licensed Practical Nurse', 'LPN', 'Licensed Vocational Nurse', 'LVN'],
    'healthcare administrator': ['Healthcare Administrator', 'Medical Administrator', 'Healthcare Manager', 'Hospital Administrator'],
    'director of nursing': ['Director of Nursing', 'DON', 'Nursing Director', 'Chief Nursing Officer', 'CNO'],
    'surgical technologist': ['Surgical Technologist', 'Surgical Tech', 'Operating Room Technician', 'OR Tech'],
    'medical assistant': ['Medical Assistant', 'MA', 'Clinical Assistant', 'Healthcare Assistant'],
    'physical therapist': ['Physical Therapist', 'PT', 'Physiotherapist', 'Rehabilitation Therapist', 'Physical Therapy Specialist'],
    'occupational therapist': ['Occupational Therapist', 'OT', 'Rehabilitation Therapist', 'Occupational Therapy Specialist'],
    'respiratory therapist': ['Respiratory Therapist', 'RT', 'Pulmonary Therapist', 'Breathing Therapist', 'Respiratory Care Practitioner'],
    'pharmacist': ['Pharmacist', 'PharmD', 'Clinical Pharmacist', 'Hospital Pharmacist', 'Retail Pharmacist'],
    'radiologic technologist': ['Radiologic Technologist', 'Radiology Tech', 'X-Ray Technician', 'Medical Imaging Technologist'],
    'laboratory technician': ['Laboratory Technician', 'Lab Tech', 'Medical Laboratory Technician', 'Clinical Lab Tech'],
    'social worker': ['Social Worker', 'Medical Social Worker', 'Clinical Social Worker', 'Hospital Social Worker'],
    'case manager': ['Case Manager', 'Care Coordinator', 'Patient Care Coordinator', 'Discharge Planner']
  };
  
  // Find the best match
  let bestMatch = null;
  let maxMatchLength = 0;
  
  Object.keys(expansions).forEach(key => {
    if (lowerTitle.includes(key) && key.length > maxMatchLength) {
      bestMatch = key;
      maxMatchLength = key.length;
    }
  });
  
  if (bestMatch) {
    const result = [jobTitle, ...expansions[bestMatch]];
    console.log('🔄 Basic expansion result:', result);
    return [...new Set(result)]; // Remove duplicates
  }
  
  // If no match found, return the original title
  console.log('🔄 No expansion found, returning original title');
  return [jobTitle];
}

export async function extractEntities(query: string): Promise<SearchQuery> {
  if (!query || typeof query !== 'string') {
    console.error('❌ Invalid query for entity extraction:', query);
    return {
      originalQuery: query || '',
      extractedEntities: {
        jobTitles: [],
        locations: [],
        experienceRange: {},
        skills: [],
        industries: []
      }
    };
  }

  console.log('🔍 Starting entity extraction for query:', query);
  
  // Get AI configuration for entity extraction
  const modelConfig = getAIModelForTask('entityExtraction');
  const promptConfig = getPromptForTask('entityExtraction');

  try {
    console.log('📤 Sending entity extraction request to OpenAI...');
    console.log('🔧 Using model:', modelConfig.model);
    
    const completion = await openai.chat.completions.create({
      model: modelConfig.model,
      messages: [
        {
          role: "system",
          content: promptConfig.system
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Log the AI interaction
    logAIInteraction('Entity Extraction', 
      `System: ${promptConfig.system}\n\nUser: ${query}`, 
      response,
      {
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        usage: completion.usage
      }
    );

    const extractedData = JSON.parse(cleanJSONResponse(response));
    
    const result = {
      originalQuery: query,
      extractedEntities: {
        jobTitles: extractedData.jobTitles || [],
        locations: extractedData.locations || [],
        experienceRange: extractedData.experienceRange || {},
        skills: extractedData.skills || [],
        industries: extractedData.industries || [],
        education: extractedData.education
      }
    };

    console.log('✅ Entity extraction successful:', result);
    return result;
    
  } catch (error) {
    logError('Entity Extraction', error, { query });
    
    console.log('🔄 Falling back to basic extraction...');
    // Fallback to basic extraction
    const fallbackResult = {
      originalQuery: query,
      extractedEntities: {
        jobTitles: basicJobTitleExtraction(query),
        locations: basicLocationExtraction(query),
        experienceRange: basicExperienceExtraction(query),
        skills: basicSkillsExtraction(query),
        industries: basicIndustryExtraction(query)
      }
    };
    
    console.log('🔄 Fallback extraction result:', fallbackResult);
    return fallbackResult;
  }
}

// IMPROVED FUZZY SEARCH WITH STREAMING SUPPORT
export async function searchCandidates(
  candidates: Candidate[], 
  searchQuery: SearchQuery,
  onPartialResults?: (results: CandidateMatch[]) => void
): Promise<CandidateMatch[]> {
  // Validate inputs
  if (!candidates || !Array.isArray(candidates)) {
    console.error('❌ Invalid candidates array:', candidates);
    return [];
  }

  if (!searchQuery || !searchQuery.originalQuery) {
    console.error('❌ Invalid search query:', searchQuery);
    return [];
  }

  console.log('🔍 Starting optimized candidate search with streaming...');
  console.log('📊 Search Query:', searchQuery);
  console.log('👥 Total candidates in database:', candidates.length);
  
  const startTime = Date.now();
  
  // STEP 1: Apply hard filters to narrow down candidates (more lenient)
  console.log('🔧 STEP 1: Applying lenient hard filters...');
  const filteredCandidates = applyLenientHardFilters(candidates, searchQuery);
  console.log(`✂️ Hard filters reduced candidates from ${candidates.length} to ${filteredCandidates.length}`);
  
  if (filteredCandidates.length === 0) {
    console.log('❌ No candidates passed hard filters, returning empty results');
    return [];
  }
  
  // STEP 2: Apply simple keyword matching for additional scoring
  console.log('🔧 STEP 2: Applying simple keyword matching...');
  const keywordMatches = applySimpleKeywordMatching(filteredCandidates, searchQuery);
  console.log(`🎯 Keyword matching selected ${keywordMatches.length} candidates for AI analysis`);
  
  if (keywordMatches.length === 0) {
    console.log('❌ No candidates passed keyword matching, returning empty results');
    return [];
  }
  
  // STEP 3: AI analysis only on pre-filtered candidates with streaming
  console.log('🔧 STEP 3: Running AI analysis on keyword-matched candidates...');
  const candidatesForAI = keywordMatches.slice(0, 20);
  // const candidatesForBasicMatch = keywordMatches.slice(20);
  const aiMatches = await runAIAnalysisWithStreaming(candidatesForAI, searchQuery, onPartialResults);
  
  const endTime = Date.now();
  console.log(`🎯 Search completed in ${endTime - startTime}ms`);
  console.log(`📊 Final Results: ${aiMatches.length} matches found`);
  console.log('🏆 Top 3 matches:', aiMatches.slice(0, 3).map(m => ({
    name: m.candidate.name,
    score: m.explanation.score,
    category: m.explanation.category
  })));
  
  return aiMatches;
}

function applyLenientHardFilters(candidates: Candidate[], searchQuery: SearchQuery): Candidate[] {
  console.log('🔧 Applying lenient hard filters...');
  const { extractedEntities } = searchQuery;
  
  let filtered = candidates;
  
  // Job Title Hard Filter (more lenient - partial matches)
  if (extractedEntities.jobTitles && extractedEntities.jobTitles.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(candidate => {
      if (!candidate || !candidate.jobTitle || typeof candidate.jobTitle !== 'string') {
        console.warn('⚠️ Invalid candidate job title:', candidate);
        return false;
      }
      
      const candidateTitle = candidate.jobTitle.toLowerCase();
      return extractedEntities.jobTitles.some(title => {
        if (!title || typeof title !== 'string') return false;
        
        const titleLower = title.toLowerCase();
        return (
          candidateTitle.includes(titleLower) ||
          titleLower.includes(candidateTitle) ||
          // Check for common keywords
          (titleLower.includes('nurse') && candidateTitle.includes('nurse')) ||
          (titleLower.includes('administrator') && candidateTitle.includes('administrator')) ||
          (titleLower.includes('technologist') && candidateTitle.includes('technologist')) ||
          (titleLower.includes('therapist') && candidateTitle.includes('therapist')) ||
          // Check for abbreviations
          (titleLower === 'rn' && candidateTitle.includes('nurse')) ||
          (titleLower === 'np' && candidateTitle.includes('practitioner')) ||
          (titleLower === 'lpn' && candidateTitle.includes('practical')) ||
          (titleLower === 'cns' && candidateTitle.includes('specialist'))
        );
      });
    });
    console.log(`📋 Job title filter: ${beforeCount} → ${filtered.length} candidates`);
  }
  
  // Location Hard Filter (more lenient - partial matches)
  if (extractedEntities.locations && extractedEntities.locations.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(candidate => {
      if (!candidate || !candidate.location || typeof candidate.location !== 'string') {
        console.warn('⚠️ Invalid candidate location:', candidate);
        return false;
      }
      
      const candidateLocation = candidate.location.toLowerCase();
      return extractedEntities.locations.some(location => {
        if (!location || typeof location !== 'string') return false;
        
        const locationLower = location.toLowerCase();
        return (
          candidateLocation.includes(locationLower) || locationLower.includes(candidateLocation)
        );
      });
    });
    console.log(`📍 Location filter: ${beforeCount} → ${filtered.length} candidates`);
  }
  
  // Experience Hard Filter (more lenient - allow ±2 years variance)
  if (extractedEntities.experienceRange && extractedEntities.experienceRange.min !== undefined) {
    const beforeCount = filtered.length;
    const minExp = Math.max(0, extractedEntities.experienceRange.min - 2); // Allow 2 years less
    const maxExp = extractedEntities.experienceRange.max ? 
      extractedEntities.experienceRange.max + 2 : undefined; // Allow 2 years more
    
    filtered = filtered.filter(candidate => {
      if (!candidate || typeof candidate.experience !== 'number') {
        console.warn('⚠️ Invalid candidate experience:', candidate);
        return false;
      }
      
      if (maxExp !== undefined) {
        return candidate.experience >= minExp && candidate.experience <= maxExp;
      } else {
        return candidate.experience >= minExp;
      }
    });
    console.log(`⏱️ Experience filter (${minExp}${maxExp ? `-${maxExp}` : '+'}): ${beforeCount} → ${filtered.length} candidates`);
  }
  
  // Industry Hard Filter (Healthcare is usually implied, so very lenient)
  if (extractedEntities.industries && extractedEntities.industries.length > 0 && !extractedEntities.industries.includes('Healthcare')) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(candidate => {
      if (!candidate || !candidate.industry || typeof candidate.industry !== 'string') {
        console.warn('⚠️ Invalid candidate industry:', candidate);
        return false;
      }
      
      return extractedEntities.industries.some(industry => {
        if (!industry || typeof industry !== 'string') return false;
        return candidate.industry.toLowerCase().includes(industry.toLowerCase());
      });
    });
    console.log(`🏭 Industry filter: ${beforeCount} → ${filtered.length} candidates`);
  }
  
  console.log(`✅ Lenient hard filters complete: ${candidates.length} → ${filtered.length} candidates`);
  return filtered;
}

function applySimpleKeywordMatching(candidates: Candidate[], searchQuery: SearchQuery): Candidate[] {
  console.log('🔧 Applying simple keyword matching for relevance scoring...');
  const { extractedEntities, originalQuery } = searchQuery;
  
  // Extract all keywords from the original query
  const queryKeywords = originalQuery.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2) // Filter out short words
    .filter(word => !['the', 'and', 'or', 'in', 'at', 'with', 'for', 'of', 'to', 'a', 'an'].includes(word));
  
  console.log('🔍 Query keywords:', queryKeywords);
  
  // Calculate simple keyword scores for each candidate
  const candidatesWithScores = candidates.map(candidate => {
    if (!candidate) {
      console.warn('⚠️ Invalid candidate in keyword matching:', candidate);
      return { candidate, keywordScore: 0 };
    }
    
    let keywordScore = 0;
    
    // Check job title keywords
    if (candidate.jobTitle && typeof candidate.jobTitle === 'string') {
      const titleWords = candidate.jobTitle.toLowerCase().split(/\s+/);
      queryKeywords.forEach(keyword => {
        if (titleWords.some(word => word.includes(keyword) || keyword.includes(word))) {
          keywordScore += 15; // High weight for title matches
        }
      });
    }
    
    // Check skills keywords
    if (candidate.skills && Array.isArray(candidate.skills)) {
      const skillsText = candidate.skills.join(' ').toLowerCase();
      queryKeywords.forEach(keyword => {
        if (skillsText.includes(keyword)) {
          keywordScore += 10; // Medium weight for skills
        }
      });
    }
    
    // Check summary keywords
    if (candidate.summary && typeof candidate.summary === 'string') {
      const summaryText = candidate.summary.toLowerCase();
      queryKeywords.forEach(keyword => {
        if (summaryText.includes(keyword)) {
          keywordScore += 5; // Lower weight for summary
        }
      });
    }
    
    // Check location keywords
    if (candidate.location && typeof candidate.location === 'string') {
      const locationText = candidate.location.toLowerCase();
      queryKeywords.forEach(keyword => {
        if (locationText.includes(keyword)) {
          keywordScore += 12; // High weight for location
        }
      });
    }
    
    // Bonus for specific skill matches
    if (extractedEntities.skills && extractedEntities.skills.length > 0 && candidate.skills && Array.isArray(candidate.skills)) {
      const skillMatches = extractedEntities.skills.filter(skill => 
        candidate.skills.some(candidateSkill => {
          if (!skill || !candidateSkill || typeof skill !== 'string' || typeof candidateSkill !== 'string') {
            return false;
          }
          return candidateSkill.toLowerCase().includes(skill.toLowerCase()) ||
                 skill.toLowerCase().includes(candidateSkill.toLowerCase());
        })
      );
      keywordScore += skillMatches.length * 8;
    }
    
    // Availability bonus
    if (candidate.availability === 'available') {
      keywordScore += 5;
    } else if (candidate.availability === 'passive') {
      keywordScore += 3;
    }
    
    return { candidate, keywordScore };
  });
  
  // Sort by keyword score and take candidates with meaningful scores
  const sortedCandidates = candidatesWithScores
    .filter(item => item.keywordScore > 0) // Only candidates with some relevance
    .sort((a, b) => b.keywordScore - a.keywordScore);
  
  console.log('🎯 Keyword matching scores:');
  sortedCandidates.slice(0, 8).forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.candidate.name}: ${item.keywordScore} points`);
  });
  
  const result = sortedCandidates.map(item => item.candidate);
  console.log(`✅ Keyword matching complete: Selected ${result.length} candidates for AI analysis`);
  return result;
}

async function runAIAnalysisOnAll(
  candidates: Candidate[], 
  searchQuery: SearchQuery,
  onPartialResults?: (results: CandidateMatch[]) => void
): Promise<CandidateMatch[]> {
  console.log(`🤖 Running AI analysis on all ${candidates.length} candidates (fallback mode)...`);
  
  const matches: CandidateMatch[] = [];
  
  // Process candidates with basic matching first, then AI for top candidates
  const basicMatches = candidates.map(candidate => {
    const explanation = calculateBasicMatch(candidate, searchQuery);
    return { candidate, explanation };
  }).sort((a, b) => b.explanation.score - a.explanation.score);
  
  // Take top 10 for AI analysis, rest get basic scores
  const topCandidates = basicMatches.slice(0, 10);
  const remainingCandidates = basicMatches.slice(10);
  
  // AI analysis for top candidates with streaming
  for (const match of topCandidates) {
    try {
      const aiExplanation = await calculateMatchWithAI(match.candidate, searchQuery, matches.length + 1);
      const newMatch = { candidate: match.candidate, explanation: aiExplanation };
      matches.push(newMatch);
      
      // Stream partial results
      if (onPartialResults) {
        onPartialResults([...matches, ...remainingCandidates]);
      }
    } catch (error) {
      console.log(`⚠️ AI analysis failed for ${match.candidate.name}, using basic score`);
      matches.push(match);
      
      // Stream partial results
      if (onPartialResults) {
        onPartialResults([...matches, ...remainingCandidates]);
      }
    }
  }
  
  // Add remaining candidates with basic scores
  matches.push(...remainingCandidates);
  
  return matches.filter(match => match.explanation.score >= 25); // Lower threshold for fallback
}

async function runAIAnalysisWithStreaming(
  candidates: Candidate[], 
  searchQuery: SearchQuery,
  onPartialResults?: (results: CandidateMatch[]) => void
): Promise<CandidateMatch[]> {
  console.log(`🤖 Starting AI analysis on ${candidates.length} pre-filtered candidates with streaming...`);
  
  const matches: CandidateMatch[] = [];
  
  // Process candidates in smaller batches for better performance and streaming
  const batchSize = 3;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    console.log(`📦 Processing AI batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(candidates.length/batchSize)} (${batch.length} candidates)`);
    
    const batchPromises = batch.map((candidate, index) => {
      console.log(`🔄 Starting AI analysis for candidate ${i + index + 1}: ${candidate.name}`);
      return calculateMatchWithAI(candidate, searchQuery, i + index + 1);
    });
    
    try {
      const batchResults = await Promise.all(batchPromises);
      
      batch.forEach((candidate, index) => {
        const explanation = batchResults[index];
        console.log(`✅ AI analysis complete for ${candidate.name}: Score ${explanation.score}%, Category: ${explanation.category}`);
        
        // Include candidates with lower threshold (25% instead of 30%)
        if (explanation.score >= 25) {
          matches.push({ candidate, explanation });
        } else {
          console.log(`⚠️ Excluding ${candidate.name} due to low AI score: ${explanation.score}%`);
        }
      });
      
      // Stream partial results after each batch
      if (onPartialResults && matches.length > 0) {
        const sortedMatches = matches.sort((a, b) => b.explanation.score - a.explanation.score);
        onPartialResults(sortedMatches);
      }
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < candidates.length) {
        console.log('⏳ Waiting 300ms before next batch...');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      logError('AI Batch Processing', error, { batchIndex: Math.floor(i/batchSize), batchSize: batch.length });
      
      console.log('🔄 Falling back to basic matching for this batch...');
      // Fallback to basic matching for this batch
      batch.forEach(candidate => {
        const explanation = calculateBasicMatch(candidate, searchQuery);
        if (explanation.score >= 25) { // Lower threshold
          matches.push({ candidate, explanation });
        }
      });
      
      // Stream partial results even for fallback
      if (onPartialResults && matches.length > 0) {
        const sortedMatches = matches.sort((a, b) => b.explanation.score - a.explanation.score);
        onPartialResults(sortedMatches);
      }
    }
  }
  
  const sortedMatches = matches.sort((a, b) => b.explanation.score - a.explanation.score);
  console.log(`🎯 AI analysis completed! ${sortedMatches.length} candidates with scores ≥25%`);
  
  return sortedMatches;
}

async function calculateMatchWithAI(candidate: Candidate, searchQuery: SearchQuery, candidateNumber: number): Promise<MatchExplanation> {
  // Get AI configuration for candidate matching
  const modelConfig = getAIModelForTask('candidateMatching');
  const promptConfig = getPromptForTask('candidateMatching');

  const userPrompt = `
SEARCH QUERY: "${searchQuery.originalQuery}"

EXTRACTED CRITERIA:
- Job Titles: ${searchQuery.extractedEntities.jobTitles?.join(', ') || 'None specified'}
- Locations: ${searchQuery.extractedEntities.locations?.join(', ') || 'None specified'}
- Experience Range: ${searchQuery.extractedEntities.experienceRange?.min ? `${searchQuery.extractedEntities.experienceRange.min}+ years` : 'Not specified'}
- Skills: ${searchQuery.extractedEntities.skills?.join(', ') || 'None specified'}
- Industries: ${searchQuery.extractedEntities.industries?.join(', ') || 'None specified'}
- Education: ${searchQuery.extractedEntities.education || 'Not specified'}

CANDIDATE PROFILE:
- Name: ${candidate.name || 'Unknown'}
- Job Title: ${candidate.jobTitle || 'Unknown'}
- Location: ${candidate.location || 'Unknown'}
- Experience: ${candidate.experience || 0} years
- Skills: ${candidate.skills?.join(', ') || 'None listed'}
- Industry: ${candidate.industry || 'Unknown'}
- Education: ${candidate.education || 'Not specified'}
- Summary: ${candidate.summary || 'No summary available'}
- Availability: ${candidate.availability || 'Unknown'}

Evaluate this match and provide detailed scoring with specific reasons.`;

  try {
    console.log(`📤 Sending match analysis request for candidate #${candidateNumber}: ${candidate.name}`);
    console.log('🔧 Using model:', modelConfig.model);
    
    const completion = await openai.chat.completions.create({
      model: modelConfig.model,
      messages: [
        {
          role: "system",
          content: promptConfig.system
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Log the AI interaction
    logAIInteraction(`Match Analysis #${candidateNumber} (${candidate.name})`, 
      `System: ${promptConfig.system}\n\nUser: ${userPrompt}`, 
      response,
      {
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        usage: completion.usage,
        candidate: candidate.name
      }
    );

    const result = JSON.parse(cleanJSONResponse(response));
    
    const explanation = {
      score: Math.min(100, Math.max(0, result.score || 0)),
      reasons: result.reasons || ['Match analysis completed'],
      category: result.category || (result.score >= 90 ? 'excellent' : result.score >= 70 ? 'good' : 'potential')
    };

    console.log(`✅ AI analysis complete for ${candidate.name}:`, explanation);
    return explanation;
    
  } catch (error) {
    logError(`Match Analysis for ${candidate.name}`, error, { 
      candidateNumber, 
      candidateName: candidate.name,
      searchQuery: searchQuery.originalQuery 
    });
    
    console.log(`🔄 Falling back to basic matching for ${candidate.name}...`);
    // Fallback to basic matching
    const fallbackResult = calculateBasicMatch(candidate, searchQuery);
    console.log(`🔄 Basic match result for ${candidate.name}:`, fallbackResult);
    return fallbackResult;
  }
}

// Enhanced fallback functions
function basicJobTitleExtraction(query: string): string[] {
  if (!query || typeof query !== 'string') {
    console.warn('⚠️ Invalid query for job title extraction:', query);
    return [];
  }

  console.log('🔄 Using basic job title extraction for:', query);
  
  const lowerQuery = query.toLowerCase();
  const expansions: { [key: string]: string[] } = {
    'registered nurse': ['Registered Nurse', 'RN', 'Staff Nurse', 'Bedside Nurse'],
    'rn': ['Registered Nurse', 'RN', 'Staff Nurse'],
    'nurse practitioner': ['Nurse Practitioner', 'NP', 'Advanced Practice Nurse'],
    'emergency room nurse': ['Emergency Room Nurse', 'ER Nurse', 'Emergency Nurse'],
    'clinical nurse specialist': ['Clinical Nurse Specialist', 'CNS'],
    'licensed practical nurse': ['Licensed Practical Nurse', 'LPN'],
    'healthcare administrator': ['Healthcare Administrator', 'Medical Administrator'],
    'director of nursing': ['Director of Nursing', 'DON', 'Nursing Director'],
    'physical therapist': ['Physical Therapist', 'PT', 'Physiotherapist'],
    'occupational therapist': ['Occupational Therapist', 'OT'],
    'respiratory therapist': ['Respiratory Therapist', 'RT']
  };
  
  const found = new Set<string>();
  Object.entries(expansions).forEach(([key, values]) => {
    if (lowerQuery.includes(key)) {
      values.forEach(value => found.add(value));
    }
  });
  
  const result = Array.from(found);
  console.log('🔄 Basic job titles extracted:', result);
  return result;
}

function basicLocationExtraction(query: string): string[] {
  if (!query || typeof query !== 'string') {
    console.warn('⚠️ Invalid query for location extraction:', query);
    return [];
  }

  console.log('🔄 Using basic location extraction for:', query);
  
  const lowerQuery = query.toLowerCase();
  const expansions: { [key: string]: string[] } = {
    'new york': ['New York', 'NY', 'New York City', 'NYC'],
    'ny': ['New York', 'NY'],
    'los angeles': ['Los Angeles', 'LA', 'California'],
    'la': ['Los Angeles', 'LA'],
    'london': ['London', 'UK', 'United Kingdom'],
    'toronto': ['Toronto', 'Canada'],
    'chicago': ['Chicago', 'IL', 'Illinois'],
    'miami': ['Miami', 'FL', 'Florida']
  };
  
  const found = new Set<string>();
  Object.entries(expansions).forEach(([key, values]) => {
    if (lowerQuery.includes(key)) {
      values.forEach(value => found.add(value));
    }
  });
  
  const result = Array.from(found);
  console.log('🔄 Basic locations extracted:', result);
  return result;
}

function basicExperienceExtraction(query: string): { min?: number; max?: number } {
  if (!query || typeof query !== 'string') {
    console.warn('⚠️ Invalid query for experience extraction:', query);
    return {};
  }

  console.log('🔄 Using basic experience extraction for:', query);
  
  const patterns = [
    /(\d+)\+\s*years?/i,
    /(\d+)\s*to\s*(\d+)\s*years?/i,
    /(\d+)-(\d+)\s*years?/i,
    /at least\s*(\d+)\s*years?/i,
    /minimum\s*(\d+)\s*years?/i
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      let result;
      if (pattern.source.includes('+') || pattern.source.includes('least') || pattern.source.includes('minimum')) {
        result = { min: parseInt(match[1]) };
      } else if (match[2]) {
        result = { min: parseInt(match[1]), max: parseInt(match[2]) };
      }
      console.log('🔄 Basic experience extracted:', result);
      return result || {};
    }
  }
  
  console.log('🔄 No experience requirements found');
  return {};
}

function basicSkillsExtraction(query: string): string[] {
  if (!query || typeof query !== 'string') {
    console.warn('⚠️ Invalid query for skills extraction:', query);
    return [];
  }

  console.log('🔄 Using basic skills extraction for:', query);
  
  const lowerQuery = query.toLowerCase();
  const skillMappings: { [key: string]: string[] } = {
    'pediatric': ['Pediatric Care', 'Pediatric Nursing', 'Child Healthcare'],
    'oncology': ['Oncology', 'Cancer Care', 'Chemotherapy'],
    'icu': ['ICU', 'Intensive Care', 'Critical Care'],
    'emergency': ['Emergency Medicine', 'Trauma Care', 'Emergency Response'],
    'spanish': ['Spanish Language', 'Bilingual', 'Spanish Fluency'],
    'bilingual': ['Bilingual', 'Multilingual'],
    'ehr': ['Electronic Health Records', 'EHR', 'Medical Records'],
    'surgery': ['Surgical', 'Operating Room', 'Perioperative Care'],
    'physical therapy': ['Physical Therapy', 'Rehabilitation', 'PT'],
    'occupational therapy': ['Occupational Therapy', 'Rehabilitation', 'OT'],
    'respiratory therapy': ['Respiratory Therapy', 'Pulmonary Care', 'RT']
  };
  
  const found = new Set<string>();
  Object.entries(skillMappings).forEach(([key, values]) => {
    if (lowerQuery.includes(key)) {
      values.forEach(value => found.add(value));
    }
  });
  
  const result = Array.from(found);
  console.log('🔄 Basic skills extracted:', result);
  return result;
}

function basicIndustryExtraction(query: string): string[] {
  if (!query || typeof query !== 'string') {
    console.warn('⚠️ Invalid query for industry extraction:', query);
    return [];
  }

  console.log('🔄 Using basic industry extraction for:', query);
  
  const lowerQuery = query.toLowerCase();
  const industryPatterns = ['healthcare', 'hospital', 'clinic', 'medical', 'nursing', 'therapy', 'rehabilitation'];
  const result = industryPatterns.filter(industry => lowerQuery.includes(industry));
  
  console.log('🔄 Basic industries extracted:', result);
  return result;
}

function calculateBasicMatch(candidate: Candidate, searchQuery: SearchQuery): MatchExplanation {
  if (!candidate) {
    console.warn('⚠️ Invalid candidate for basic match calculation:', candidate);
    return {
      score: 0,
      reasons: ['Invalid candidate data'],
      category: 'potential'
    };
  }

  console.log(`🔄 Calculating basic match for ${candidate.name || 'Unknown'}...`);
  
  let score = 0;
  const reasons: string[] = [];
  const { extractedEntities } = searchQuery;
  
  // Job title matching (40% weight) - more lenient
  const jobTitleMatch = extractedEntities.jobTitles?.some(title => {
    if (!title || typeof title !== 'string' || !candidate.jobTitle || typeof candidate.jobTitle !== 'string') {
      return false;
    }
    
    const titleLower = title.toLowerCase();
    const candidateTitleLower = candidate.jobTitle.toLowerCase();
    return (
      candidateTitleLower.includes(titleLower) ||
      titleLower.includes(candidateTitleLower) ||
      // Check for common keywords
      (titleLower.includes('nurse') && candidateTitleLower.includes('nurse')) ||
      (titleLower.includes('administrator') && candidateTitleLower.includes('administrator'))
    );
  });
  
  if (jobTitleMatch) {
    score += 40;
    reasons.push(`Job title alignment: ${candidate.jobTitle || 'Unknown'}`);
  } else if (!extractedEntities.jobTitles || extractedEntities.jobTitles.length === 0) {
    // If no job titles specified, give some base score
    score += 20;
    reasons.push(`Healthcare professional: ${candidate.jobTitle || 'Unknown'}`);
  }
  
  // Location matching (25% weight) - more lenient
  const locationMatch = extractedEntities.locations?.some(location => {
    if (!location || typeof location !== 'string' || !candidate.location || typeof candidate.location !== 'string') {
      return false;
    }
    
    const locationLower = location.toLowerCase();
    const candidateLocationLower = candidate.location.toLowerCase();
    return (
      candidateLocationLower.includes(locationLower) ||
      locationLower.includes(candidateLocationLower)
    );
  });
  
  if (locationMatch) {
    score += 25;
    reasons.push(`Located in target area: ${candidate.location || 'Unknown'}`);
  } else if (!extractedEntities.locations || extractedEntities.locations.length === 0) {
    // If no location specified, give some base score
    score += 15;
    reasons.push(`Available location: ${candidate.location || 'Unknown'}`);
  }
  
  // Experience matching (20% weight) - more lenient
  if (extractedEntities.experienceRange && (extractedEntities.experienceRange.min || extractedEntities.experienceRange.max)) {
    const minExp = Math.max(0, (extractedEntities.experienceRange.min || 0) - 2);
    const maxExp = extractedEntities.experienceRange.max ? 
      extractedEntities.experienceRange.max + 2 : 50;
    
    const candidateExp = candidate.experience || 0;
    
    if (candidateExp >= minExp && candidateExp <= maxExp) {
      score += 20;
      reasons.push(`Experience level: ${candidateExp} years meets requirements`);
    } else if (candidateExp >= minExp - 2) {
      score += 10;
      reasons.push(`Close experience match: ${candidateExp} years`);
    }
  } else {
    // If no experience specified, give base score
    score += 15;
    reasons.push(`${candidate.experience || 0} years of experience`);
  }
  
  // Skills matching (15% weight) - more lenient
  const skillMatches = extractedEntities.skills?.filter(skill => {
    if (!skill || typeof skill !== 'string' || !candidate.skills || !Array.isArray(candidate.skills)) {
      return false;
    }
    
    return candidate.skills.some(candidateSkill => {
      if (!candidateSkill || typeof candidateSkill !== 'string') return false;
      return candidateSkill.toLowerCase().includes(skill.toLowerCase()) ||
             skill.toLowerCase().includes(candidateSkill.toLowerCase());
    });
  }) || [];
  
  if (skillMatches.length > 0) {
    score += Math.min(15, skillMatches.length * 5);
    reasons.push(`Relevant skills: ${skillMatches.join(', ')}`);
  } else {
    // Give some score for having skills listed
    score += 5;
    const candidateSkills = candidate.skills && Array.isArray(candidate.skills) ? candidate.skills : [];
    reasons.push(`Professional skills: ${candidateSkills.slice(0, 2).join(', ') || 'Various skills'}`);
  }
  
  // Add base score for healthcare industry
  if (candidate.industry === 'Healthcare') {
    score += 10;
    reasons.push('Healthcare industry experience');
  }
  
  // Availability bonus
  if (candidate.availability === 'available') {
    score += 5;
    reasons.push('Currently available');
  } else if (candidate.availability === 'passive') {
    score += 3;
    reasons.push('Open to opportunities');
  }
  
  // Determine category with lower thresholds
  let category: 'excellent' | 'good' | 'potential';
  if (score >= 85) category = 'excellent';
  else if (score >= 65) category = 'good';
  else category = 'potential';
  
  if (reasons.length === 0) {
    reasons.push('Healthcare professional profile');
  }
  
  // Ensure minimum score of 30 for any healthcare professional
  const finalScore = Math.max(score, 30);
  
  const result = { score: finalScore, reasons, category };
  console.log(`🔄 Basic match result for ${candidate.name || 'Unknown'}:`, result);
  return result;
}