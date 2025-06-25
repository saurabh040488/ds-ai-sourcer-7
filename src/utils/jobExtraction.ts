import OpenAI from 'openai';
import { getAIModelForTask, getPromptForTask } from '../config/ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface ExtractedJobData {
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
}

function cleanJsonResponse(response: string): string {
  console.log('🧹 Cleaning JSON response...');
  
  // Remove any markdown code blocks
  let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // If the response starts with explanatory text, try to find the JSON
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart <= jsonEnd) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  console.log('🧹 Cleaned JSON:', cleaned);
  return cleaned;
}

function sanitizeJsonString(str: string): string {
  if (typeof str !== 'string') return str;
  
  // Escape quotes and other problematic characters
  return str
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')    // Escape double quotes
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '\\r')   // Escape carriage returns
    .replace(/\t/g, '\\t')   // Escape tabs
    .replace(/\f/g, '\\f')   // Escape form feeds
    .replace(/\b/g, '\\b');  // Escape backspaces
}

function parseJsonSafely(jsonString: string): any {
  console.log('🔍 Attempting to parse JSON safely...');
  
  try {
    // First attempt: direct parsing
    return JSON.parse(jsonString);
  } catch (firstError) {
    console.log('❌ First parse attempt failed:', firstError.message);
    
    try {
      // Second attempt: try to fix common JSON issues
      let fixedJson = jsonString;
      
      // Fix unescaped quotes in string values
      // This regex finds string values and escapes quotes within them
      fixedJson = fixedJson.replace(
        /"([^"]*)":\s*"([^"]*(?:\\.[^"]*)*)"/g,
        (match, key, value) => {
          // Don't double-escape already escaped quotes
          const cleanValue = value.replace(/\\"/g, '"').replace(/"/g, '\\"');
          return `"${key}": "${cleanValue}"`;
        }
      );
      
      // Fix array string values
      fixedJson = fixedJson.replace(
        /"([^"]*)":\s*\[([^\]]*)\]/g,
        (match, key, arrayContent) => {
          // Fix quotes in array elements
          const fixedArrayContent = arrayContent.replace(
            /"([^"]*(?:\\.[^"]*)*)"/g,
            (itemMatch, itemValue) => {
              const cleanItemValue = itemValue.replace(/\\"/g, '"').replace(/"/g, '\\"');
              return `"${cleanItemValue}"`;
            }
          );
          return `"${key}": [${fixedArrayContent}]`;
        }
      );
      
      console.log('🔧 Attempting to parse fixed JSON...');
      return JSON.parse(fixedJson);
    } catch (secondError) {
      console.log('❌ Second parse attempt failed:', secondError.message);
      
      try {
        // Third attempt: manually construct object from key-value pairs
        console.log('🔧 Attempting manual JSON reconstruction...');
        
        const result: any = {};
        
        // Extract title
        const titleMatch = jsonString.match(/"title":\s*"([^"]*(?:\\.[^"]*)*)"/);
        if (titleMatch) result.title = titleMatch[1].replace(/\\"/g, '"');
        
        // Extract description (handle multiline)
        const descMatch = jsonString.match(/"description":\s*"((?:[^"\\]|\\.)*)"/s);
        if (descMatch) result.description = descMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
        
        // Extract location
        const locationMatch = jsonString.match(/"location":\s*"([^"]*(?:\\.[^"]*)*)"/);
        if (locationMatch) result.location = locationMatch[1].replace(/\\"/g, '"');
        
        // Extract company_name
        const companyMatch = jsonString.match(/"company_name":\s*"([^"]*(?:\\.[^"]*)*)"/);
        if (companyMatch) result.company_name = companyMatch[1].replace(/\\"/g, '"');
        
        // Extract reference_number
        const refMatch = jsonString.match(/"reference_number":\s*"([^"]*(?:\\.[^"]*)*)"/);
        if (refMatch) result.reference_number = refMatch[1].replace(/\\"/g, '"');
        
        // Extract shift_timings
        const shiftMatch = jsonString.match(/"shift_timings":\s*"([^"]*(?:\\.[^"]*)*)"/);
        if (shiftMatch) result.shift_timings = shiftMatch[1].replace(/\\"/g, '"');
        
        // Extract salary_range
        const salaryMatch = jsonString.match(/"salary_range":\s*"([^"]*(?:\\.[^"]*)*)"/);
        if (salaryMatch) result.salary_range = salaryMatch[1].replace(/\\"/g, '"');
        
        // Extract employment_type
        const empTypeMatch = jsonString.match(/"employment_type":\s*"([^"]*(?:\\.[^"]*)*)"/);
        if (empTypeMatch) result.employment_type = empTypeMatch[1].replace(/\\"/g, '"');
        
        // Extract apply_url
        const urlMatch = jsonString.match(/"apply_url":\s*"([^"]*(?:\\.[^"]*)*)"/);
        if (urlMatch) result.apply_url = urlMatch[1].replace(/\\"/g, '"');
        
        // Extract requirements array
        const reqMatch = jsonString.match(/"requirements":\s*\[(.*?)\]/s);
        if (reqMatch) {
          const reqContent = reqMatch[1];
          const requirements = [];
          const reqItems = reqContent.match(/"((?:[^"\\]|\\.)*)"/g);
          if (reqItems) {
            for (const item of reqItems) {
              const cleanItem = item.slice(1, -1).replace(/\\"/g, '"');
              requirements.push(cleanItem);
            }
          }
          result.requirements = requirements;
        }
        
        console.log('✅ Manual JSON reconstruction successful:', result);
        return result;
        
      } catch (thirdError) {
        console.error('❌ All JSON parsing attempts failed:', thirdError.message);
        throw new Error(`Failed to parse JSON after multiple attempts: ${firstError.message}`);
      }
    }
  }
}

function validateJsonStructure(data: any): ExtractedJobData {
  console.log('✅ Validating JSON structure:', data);
  
  // Ensure all required fields exist with proper types
  const result: ExtractedJobData = {
    title: typeof data.title === 'string' ? data.title : 'Healthcare Professional',
    description: typeof data.description === 'string' ? data.description : 'Join our healthcare team.',
    requirements: Array.isArray(data.requirements) ? data.requirements.filter(req => typeof req === 'string') : ['Professional certification required'],
    location: typeof data.location === 'string' ? data.location : 'Multiple locations',
    salary_range: typeof data.salary_range === 'string' ? data.salary_range : undefined,
    employment_type: ['full-time', 'part-time', 'contract', 'temporary'].includes(data.employment_type) 
      ? data.employment_type 
      : 'full-time',
    company_name: typeof data.company_name === 'string' ? data.company_name : undefined,
    reference_number: typeof data.reference_number === 'string' ? data.reference_number : undefined,
    shift_timings: typeof data.shift_timings === 'string' ? data.shift_timings : undefined,
    apply_url: typeof data.apply_url === 'string' ? data.apply_url : ''
  };
  
  console.log('✅ Validated structure:', result);
  return result;
}

export async function extractJobFromUrl(jobUrl: string): Promise<ExtractedJobData> {
  console.log('🔍 Starting job extraction from URL:', jobUrl);

  // Get AI configuration for job extraction
  const modelConfig = getAIModelForTask('jobExtraction');
  const promptConfig = getPromptForTask('jobExtraction');

  try {
    console.log('📤 Sending job extraction request to OpenAI...');
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
          content: `Extract comprehensive job information from this URL: ${jobUrl}

Please extract:
- Job title and description (handle quotes properly)
- Company name and reference number
- Location and shift timings
- Salary range and employment type
- All requirements and qualifications

Return only valid JSON with proper quote escaping.`
        }
      ],
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    console.log('📥 Raw OpenAI response:', response);

    // Clean the response
    const cleanedResponse = cleanJsonResponse(response);
    
    // Parse JSON with enhanced error handling
    const parsedData = parseJsonSafely(cleanedResponse);
    console.log('✅ JSON parsed successfully:', parsedData);

    // Validate and structure the data
    const result = validateJsonStructure(parsedData);
    
    // Ensure apply_url is set to the original URL
    result.apply_url = jobUrl;

    console.log('✅ Job extraction successful:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error extracting job from URL:', error);
    
    // Provide a more detailed error message
    if (error.message.includes('JSON')) {
      console.error('❌ This appears to be a JSON parsing issue. The AI response may not be properly formatted.');
    }
    
    // Fallback to basic extraction based on URL
    const fallbackResult = createFallbackJobData(jobUrl);
    console.log('🔄 Using fallback job data:', fallbackResult);
    return fallbackResult;
  }
}

function createFallbackJobData(jobUrl: string): ExtractedJobData {
  console.log('🔄 Creating fallback job data for:', jobUrl);
  
  // Try to extract some basic info from URL
  const urlParts = jobUrl.toLowerCase();
  
  let title = 'Healthcare Professional';
  let location = 'Multiple locations';
  let employment_type: 'full-time' | 'part-time' | 'contract' | 'temporary' = 'full-time';
  let company_name = undefined;
  
  // Basic URL pattern matching
  if (urlParts.includes('nurse')) title = 'Registered Nurse';
  else if (urlParts.includes('doctor') || urlParts.includes('physician')) title = 'Physician';
  else if (urlParts.includes('therapist')) title = 'Therapist';
  else if (urlParts.includes('technician')) title = 'Medical Technician';
  else if (urlParts.includes('administrator')) title = 'Healthcare Administrator';
  
  if (urlParts.includes('part-time')) employment_type = 'part-time';
  else if (urlParts.includes('contract')) employment_type = 'contract';
  else if (urlParts.includes('temporary')) employment_type = 'temporary';

  // Try to extract company name from URL
  try {
    const url = new URL(jobUrl);
    const hostname = url.hostname.replace('www.', '');
    const parts = hostname.split('.');
    if (parts.length > 1) {
      company_name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  } catch (e) {
    // Ignore URL parsing errors
  }

  return {
    title,
    description: `We are seeking a qualified ${title} to join our healthcare team. This position offers an opportunity to make a meaningful impact in patient care while working in a supportive and professional environment.\n\nThe successful candidate will be responsible for providing high-quality healthcare services, collaborating with multidisciplinary teams, and maintaining the highest standards of patient care and safety.\n\nWe offer competitive compensation, comprehensive benefits, and opportunities for professional growth and development.`,
    requirements: [
      'Relevant professional certification/license required',
      'Previous healthcare experience preferred',
      'Strong communication and interpersonal skills',
      'Ability to work effectively in a team environment',
      'Commitment to patient care excellence'
    ],
    location,
    employment_type,
    company_name,
    apply_url: jobUrl
  };
}

export async function generateJobDescription(jobTitle: string, additionalContext?: string): Promise<{
  description: string;
  requirements: string[];
}> {
  console.log('🤖 Generating job description for:', jobTitle);

  // Get AI configuration for job description generation
  const modelConfig = getAIModelForTask('jobExtraction'); // Reuse the same model config
  const promptConfig = getPromptForTask('jobExtraction'); // Reuse the same prompt config

  const systemPrompt = `You are an expert HR professional specializing in healthcare recruitment.

CRITICAL: Respond with ONLY a valid JSON object. No explanatory text, no markdown, no code blocks.
IMPORTANT: Properly escape all quotes and special characters in the JSON response.

Generate a professional job description and requirements. Return this exact JSON structure:

{
  "description": "Professional job description with proper quote escaping",
  "requirements": ["requirement 1", "requirement 2", "requirement 3"]
}

Guidelines:
- Description: 3-4 paragraphs, engaging and professional
- Requirements: 5-8 specific, realistic requirements
- Focus on healthcare industry standards
- Include both technical and soft skills
- Make it appealing to qualified candidates
- Properly escape any quotes or special characters in the text`;

  try {
    const userPrompt = `Job Title: ${jobTitle}${additionalContext ? `\nAdditional Context: ${additionalContext}` : ''}`;
    
    console.log('📤 Sending job description generation request to OpenAI...');
    console.log('🔧 Using model:', modelConfig.model);
    
    const completion = await openai.chat.completions.create({
      model: modelConfig.model,
      messages: [
        {
          role: "system",
          content: systemPrompt
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

    console.log('📥 Raw job description response:', response);

    // Clean and parse the response
    const cleanedResponse = cleanJsonResponse(response);
    
    const parsedData = parseJsonSafely(cleanedResponse);
    console.log('✅ Job description JSON parsed successfully');
    
    const result = {
      description: typeof parsedData.description === 'string' ? parsedData.description : `Join our team as a ${jobTitle} and make a meaningful impact in healthcare.`,
      requirements: Array.isArray(parsedData.requirements) ? parsedData.requirements.filter(req => typeof req === 'string') : ['Professional certification required']
    };
    
    console.log('✅ Job description generated successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Error generating job description:', error);
    
    // Fallback job description
    return {
      description: `We are seeking a qualified ${jobTitle} to join our healthcare team. This position offers an opportunity to make a meaningful impact in patient care while working in a supportive and professional environment.\n\nThe successful candidate will be responsible for providing high-quality healthcare services, collaborating with multidisciplinary teams, and maintaining the highest standards of patient care and safety.\n\nWe offer competitive compensation, comprehensive benefits, and opportunities for professional growth and development in a state-of-the-art healthcare facility.`,
      requirements: [
        'Relevant professional certification/license required',
        'Previous healthcare experience preferred',
        'Strong communication and interpersonal skills',
        'Ability to work effectively in a team environment',
        'Commitment to patient care excellence',
        'Proficiency in electronic health records',
        'Current CPR certification'
      ]
    };
  }
}