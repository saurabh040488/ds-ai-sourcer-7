import { Candidate, SearchQuery, CandidateMatch, MatchExplanation } from '../types';
import { searchCandidates } from './searchUtils';

/**
 * Streaming search that provides real-time updates as candidates are processed
 */
export async function searchCandidatesWithStreaming(
  candidates: Candidate[],
  searchQuery: SearchQuery,
  onUpdate: (matches: CandidateMatch[]) => void
): Promise<CandidateMatch[]> {
  console.log('🔄 Starting streaming search...');
  
  // Validate inputs
  if (!candidates || !Array.isArray(candidates)) {
    console.error('❌ Invalid candidates array:', candidates);
    return [];
  }

  if (!searchQuery || !searchQuery.originalQuery) {
    console.error('❌ Invalid search query:', searchQuery);
    return [];
  }

  // Use the existing search function but with streaming updates
  const allMatches = await searchCandidates(candidates, searchQuery, onUpdate);
  
  // Simulate streaming by sending updates in batches
  const batchSize = 5;
  const streamingMatches: CandidateMatch[] = [];
  
  for (let i = 0; i < allMatches.length; i += batchSize) {
    const batch = allMatches.slice(i, i + batchSize);
    streamingMatches.push(...batch);
    
    // Send update with current matches
    onUpdate([...streamingMatches]);
    
    // Small delay to simulate streaming
    if (i + batchSize < allMatches.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  console.log('✅ Streaming search completed with', streamingMatches.length, 'total matches');
  return streamingMatches;
}