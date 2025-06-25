import OpenAI from 'openai';
import { getAIModelForTask, getPromptForTask } from '../config/ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface CompanyBrandingData {
  name: string;
  description: string;
  industry: string;
  size: string;
  location: string;
  values: string[];
  benefits: string[];
  cultureKeywords: string[];
  logoUrl?: string;
}

interface CompanyCollateral {
  type: 'newsletters' | 'benefits' | 'who_we_are' | 'mission_statements' | 'dei_statements' | 'talent_community_link' | 'career_site_link' | 'company_logo';
  content: string; // Text for email types, URL for link types
  links: string[]; // Array of URLs if text content includes links
  last_updated: string; // ISO timestamp
  version: string; // Incremental version
}

function cleanJsonResponse(response: string): string {
  console.log('🧹 Cleaning JSON response...');
  console.log('📥 Raw response:', response);
  
  // Remove any markdown code blocks more aggressively
  let cleaned = response
    .replace(/```json\s*/gi, '') // Remove opening ```json
    .replace(/```\s*/g, '')      // Remove closing ```
    .replace(/^```/gm, '')       // Remove any ``` at start of line
    .replace(/```$/gm, '');      // Remove any ``` at end of line
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // If the response starts with explanatory text, try to find the JSON
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart <= jsonEnd) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  // Additional cleanup for common issues
  cleaned = cleaned
    .replace(/^\s*[\w\s]*?(?=\{)/g, '') // Remove any text before the first {
    .replace(/\}\s*[\w\s]*$/g, '}')     // Remove any text after the last }
    .trim();
  
  console.log('🧹 Cleaned JSON:', cleaned);
  return cleaned;
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
        
        // Extract basic fields with improved regex
        const extractField = (fieldName: string, defaultValue: any = '') => {
          const regex = new RegExp(`"${fieldName}":\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'i');
          const match = jsonString.match(regex);
          return match ? match[1].replace(/\\"/g, '"') : defaultValue;
        };
        
        const extractArray = (fieldName: string, defaultValue: any[] = []) => {
          const regex = new RegExp(`"${fieldName}":\\s*\\[(.*?)\\]`, 'is');
          const match = jsonString.match(regex);
          if (match) {
            const arrayContent = match[1];
            const items = arrayContent.match(/"([^"]*(?:\\.[^"]*)*)"/g);
            return items ? items.map(item => item.slice(1, -1).replace(/\\"/g, '"')) : defaultValue;
          }
          return defaultValue;
        };
        
        result.name = extractField('name', 'Unknown Company');
        result.description = extractField('description', 'Professional organization focused on excellence.');
        result.industry = extractField('industry', 'Business Services');
        result.size = extractField('size', 'Medium');
        result.location = extractField('location', 'Multiple locations');
        result.values = extractArray('values', ['Excellence', 'Integrity', 'Innovation']);
        result.benefits = extractArray('benefits', ['Competitive Salary', 'Health Benefits', 'Professional Growth']);
        result.cultureKeywords = extractArray('cultureKeywords', ['professional', 'collaborative', 'growth-focused']);
        result.logoUrl = extractField('logoUrl', undefined);
        
        console.log('✅ Manual JSON reconstruction successful:', result);
        return result;
        
      } catch (thirdError) {
        console.error('❌ All JSON parsing attempts failed:', thirdError.message);
        throw new Error(`Failed to parse JSON after multiple attempts: ${firstError.message}`);
      }
    }
  }
}

function parseCollateralJsonSafely(jsonString: string): CompanyCollateral[] {
  console.log('🔍 Attempting to parse collateral JSON safely...');
  
  try {
    // First attempt: direct parsing as array
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    // If it's a single object, wrap it in an array
    return [parsed];
  } catch (firstError) {
    console.log('❌ First parse attempt failed:', firstError.message);
    
    try {
      // Second attempt: try to construct array from individual objects
      console.log('🔧 Attempting to construct array from individual objects...');
      
      // Check if the string contains multiple objects separated by commas
      let cleanedString = jsonString.trim();
      
      // If it doesn't start with [, try to wrap it
      if (!cleanedString.startsWith('[')) {
        // Split by },{ pattern to find individual objects
        const objectStrings = cleanedString.split(/\},\s*\{/);
        
        if (objectStrings.length > 1) {
          // We have multiple objects, reconstruct them properly
          const reconstructedObjects = objectStrings.map((objStr, index) => {
            let cleanObj = objStr.trim();
            
            // Add missing braces
            if (index === 0 && !cleanObj.endsWith('}')) {
              cleanObj += '}';
            } else if (index === objectStrings.length - 1 && !cleanObj.startsWith('{')) {
              cleanObj = '{' + cleanObj;
            } else if (index > 0 && index < objectStrings.length - 1) {
              if (!cleanObj.startsWith('{')) cleanObj = '{' + cleanObj;
              if (!cleanObj.endsWith('}')) cleanObj += '}';
            }
            
            return cleanObj;
          });
          
          // Try to parse each object individually
          const parsedObjects: CompanyCollateral[] = [];
          
          for (const objStr of reconstructedObjects) {
            try {
              const parsed = JSON.parse(objStr);
              parsedObjects.push(parsed);
            } catch (objError) {
              console.warn('⚠️ Failed to parse individual object:', objStr);
            }
          }
          
          if (parsedObjects.length > 0) {
            console.log('✅ Successfully reconstructed array from individual objects:', parsedObjects.length);
            return parsedObjects;
          }
        } else {
          // Single object, try to parse and wrap in array
          try {
            const singleObject = JSON.parse(cleanedString);
            return [singleObject];
          } catch (singleError) {
            console.log('❌ Failed to parse as single object');
          }
        }
      }
      
      // If all else fails, try to manually extract objects
      console.log('🔧 Attempting manual object extraction...');
      
      const result: CompanyCollateral[] = [];
      
      // Look for type patterns to extract individual collateral items
      const typePattern = /"type":\s*"(newsletters|benefits|who_we_are|mission_statements|dei_statements|talent_community_link|career_site_link|company_logo)"/g;
      const matches = [...jsonString.matchAll(typePattern)];
      
      for (const match of matches) {
        const type = match[1] as CompanyCollateral['type'];
        
        // Try to extract the content for this type
        const contentPattern = new RegExp(`"type":\\s*"${type}"[^}]*"content":\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'i');
        const contentMatch = jsonString.match(contentPattern);
        
        if (contentMatch) {
          const content = contentMatch[1].replace(/\\"/g, '"');
          
          // Extract links if present
          const linksPattern = new RegExp(`"type":\\s*"${type}"[^}]*"links":\\s*\\[([^\\]]*)\\]`, 'i');
          const linksMatch = jsonString.match(linksPattern);
          
          let links: string[] = [];
          if (linksMatch) {
            const linksContent = linksMatch[1];
            const linkItems = linksContent.match(/"([^"]*(?:\\.[^"]*)*)"/g);
            if (linkItems) {
              links = linkItems.map(item => item.slice(1, -1).replace(/\\"/g, '"'));
            }
          }
          
          result.push({
            type,
            content,
            links,
            last_updated: new Date().toISOString(),
            version: '1.0'
          });
        }
      }
      
      if (result.length > 0) {
        console.log('✅ Manual extraction successful:', result.length, 'items');
        return result;
      }
      
      throw new Error('Failed to extract any collateral items');
      
    } catch (secondError) {
      console.error('❌ All collateral parsing attempts failed:', secondError.message);
      throw new Error(`Failed to parse collateral JSON: ${firstError.message}`);
    }
  }
}

export async function extractCompanyBranding(companyUrl: string): Promise<CompanyBrandingData> {
  console.log('🏢 Starting company branding extraction for:', companyUrl);

  // Get AI configuration for company branding
  const modelConfig = getAIModelForTask('companyBranding');
  const promptConfig = getPromptForTask('companyBranding');

  try {
    console.log('📤 Sending company analysis request to OpenAI...');
    console.log('🔧 Using model:', modelConfig.model);
    
    const completion = await openai.chat.completions.create({
      model: modelConfig.model,
      messages: [
        {
          role: "system",
          content: `${promptConfig.system}

CRITICAL: Respond with ONLY a valid JSON object. No explanatory text, no markdown code blocks, no additional formatting.

Return this exact JSON structure:
{
  "name": "Company Name",
  "description": "Brief company description",
  "industry": "Primary industry",
  "size": "Company size",
  "location": "Primary location",
  "values": ["value1", "value2", "value3"],
  "benefits": ["benefit1", "benefit2", "benefit3"],
  "cultureKeywords": ["keyword1", "keyword2", "keyword3"],
  "logoUrl": "URL to logo if found"
}`
        },
        {
          role: "user",
          content: `Analyze this company website and extract branding information: ${companyUrl}

Note: Since I cannot directly access the website, please provide a realistic analysis based on the URL and common patterns for companies in that domain. Focus on creating useful recruitment-focused branding information.`
        }
      ],
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    console.log('📥 Company branding analysis response received');

    // Clean and parse the response
    const cleanedResponse = cleanJsonResponse(response);
    const brandingData = parseJsonSafely(cleanedResponse);
    
    // Validate and sanitize the response
    const result: CompanyBrandingData = {
      name: brandingData.name || 'Unknown Company',
      description: brandingData.description || 'Professional organization focused on excellence.',
      industry: brandingData.industry || 'Business Services',
      size: brandingData.size || 'Medium',
      location: brandingData.location || 'Multiple locations',
      values: Array.isArray(brandingData.values) ? brandingData.values : ['Excellence', 'Integrity', 'Innovation'],
      benefits: Array.isArray(brandingData.benefits) ? brandingData.benefits : ['Competitive Salary', 'Health Benefits', 'Professional Growth'],
      cultureKeywords: Array.isArray(brandingData.cultureKeywords) ? brandingData.cultureKeywords : ['professional', 'collaborative', 'growth-focused'],
      logoUrl: brandingData.logoUrl
    };

    console.log('✅ Company branding extraction successful:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error extracting company branding:', error);
    
    // Fallback to basic branding based on URL
    const fallbackResult = createFallbackBranding(companyUrl);
    console.log('🔄 Using fallback branding:', fallbackResult);
    return fallbackResult;
  }
}

function createFallbackBranding(companyUrl: string): CompanyBrandingData {
  // Extract company name from URL
  const urlParts = companyUrl.replace(/https?:\/\//, '').split('.');
  const domain = urlParts[0];
  const companyName = domain.charAt(0).toUpperCase() + domain.slice(1);

  return {
    name: companyName,
    description: `${companyName} is a professional organization committed to excellence and innovation in their field.`,
    industry: 'Professional Services',
    size: 'Medium',
    location: 'Multiple locations',
    values: ['Excellence', 'Integrity', 'Innovation', 'Teamwork'],
    benefits: ['Competitive Compensation', 'Health Benefits', 'Professional Development', 'Work-Life Balance'],
    cultureKeywords: ['professional', 'collaborative', 'innovative', 'supportive'],
  };
}

export async function extractCompanyCollateral(mainSiteUrl: string, careerSiteUrl?: string): Promise<CompanyCollateral[]> {
  console.log('📚 Starting company collateral extraction for:', mainSiteUrl);
  if (careerSiteUrl) {
    console.log('👔 Career site URL:', careerSiteUrl);
  }

  // Get AI configuration for company branding (reuse the same config)
  const modelConfig = getAIModelForTask('companyBranding');

  const systemPrompt = `You are an AI assistant tasked with extracting and classifying specific collateral from a company's main website and career site for use in a campaign creation module of the Bolt app, a healthcare recruiting platform.

CRITICAL: Respond with ONLY a valid JSON array. No explanatory text, no markdown code blocks, no additional formatting.

Extract collateral and return this exact JSON array structure:
[
  {
    "type": "who_we_are",
    "content": "Text content here",
    "links": ["https://example.com/about"],
    "last_updated": "2023-10-01T00:00:00Z",
    "version": "1.0"
  },
  {
    "type": "mission_statements",
    "content": "Mission text here",
    "links": ["https://example.com/mission"],
    "last_updated": "2023-10-01T00:00:00Z",
    "version": "1.0"
  }
]

COLLATERAL TYPES TO EXTRACT:
- newsletters: Newsletter content and signup links
- benefits: Employee benefits information
- who_we_are: Company description and about us content
- mission_statements: Mission, vision, and values
- dei_statements: Diversity, equity, and inclusion content
- talent_community_link: Talent community or network links (URL only)
- career_site_link: Career site links (URL only)
- company_logo: Company logo image URLs (URL only)

CLASSIFICATION RULES:
- For text content types (newsletters, benefits, who_we_are, mission_statements, dei_statements): Extract full text and include any relevant links
- For link-only types (talent_community_link, career_site_link, company_logo): Put the URL in the content field and links array

IMPORTANT: Return ONLY the JSON array, nothing else.`;

  try {
    console.log('📤 Sending collateral extraction request to OpenAI...');
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
          content: `Extract collateral from these company URLs:
Main website URL: ${mainSiteUrl}
${careerSiteUrl ? `Career site URL: ${careerSiteUrl}` : ''}

Note: Since you cannot directly access the websites, please provide a realistic extraction based on the URLs and common patterns for companies in that domain. Focus on creating useful recruitment-focused collateral that could be used in email campaigns.`
        }
      ],
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    console.log('📥 Company collateral extraction response received');

    // Clean and parse the response using the specialized collateral parser
    const cleanedResponse = cleanJsonResponse(response);
    const collateralData = parseCollateralJsonSafely(cleanedResponse);
    
    // Validate and sanitize each collateral item
    const result: CompanyCollateral[] = collateralData.map(item => {
      // Ensure type is valid
      const validTypes = [
        'newsletters', 'benefits', 'who_we_are', 'mission_statements', 
        'dei_statements', 'talent_community_link', 'career_site_link', 'company_logo'
      ];
      
      const type = validTypes.includes(item.type) ? item.type : 'who_we_are';
      
      return {
        type: type as CompanyCollateral['type'],
        content: item.content || 'No content available',
        links: Array.isArray(item.links) ? item.links : [],
        last_updated: new Date().toISOString(),
        version: item.version || '1.0'
      };
    });

    console.log('✅ Company collateral extraction successful:', result.length, 'items');
    return result;
    
  } catch (error) {
    console.error('❌ Error extracting company collateral:', error);
    
    // Fallback to basic collateral
    const fallbackResult = createFallbackCollateral(mainSiteUrl, careerSiteUrl);
    console.log('🔄 Using fallback collateral:', fallbackResult.length, 'items');
    return fallbackResult;
  }
}

function createFallbackCollateral(mainSiteUrl: string, careerSiteUrl?: string): CompanyCollateral[] {
  // Extract company name from URL
  const urlParts = mainSiteUrl.replace(/https?:\/\//, '').split('.');
  const domain = urlParts[0];
  const companyName = domain.charAt(0).toUpperCase() + domain.slice(1);

  const result: CompanyCollateral[] = [
    {
      type: 'mission_statements',
      content: `At ${companyName}, our mission is to provide exceptional service and value to our customers while maintaining the highest standards of integrity and professionalism.`,
      links: [mainSiteUrl + '/about'],
      last_updated: new Date().toISOString(),
      version: '1.0'
    },
    {
      type: 'benefits',
      content: `${companyName} offers a comprehensive benefits package including health insurance, retirement plans, paid time off, and professional development opportunities.`,
      links: [careerSiteUrl ? careerSiteUrl + '/benefits' : mainSiteUrl + '/careers'],
      last_updated: new Date().toISOString(),
      version: '1.0'
    },
    {
      type: 'who_we_are',
      content: `${companyName} is a leading organization committed to excellence and innovation. Our team of dedicated professionals works together to deliver outstanding results for our clients and stakeholders.`,
      links: [mainSiteUrl + '/about'],
      last_updated: new Date().toISOString(),
      version: '1.0'
    }
  ];

  if (careerSiteUrl) {
    result.push({
      type: 'career_site_link',
      content: careerSiteUrl,
      links: [careerSiteUrl],
      last_updated: new Date().toISOString(),
      version: '1.0'
    });
  }

  return result;
}

async function generateCampaignContextFromSearch(searchQuery: string): Promise<{
  targetAudience: string;
  campaignGoal: string;
  suggestedName: string;
}> {
  console.log('🎯 Generating campaign context from search:', searchQuery);

  // Get AI configuration for campaign context generation
  const modelConfig = getAIModelForTask('campaignGeneration');

  const systemPrompt = `You are an expert recruitment strategist. Given a search query used to find candidates, generate appropriate campaign context.

Return a JSON object with:
{
  "targetAudience": "Description of the target audience based on the search",
  "campaignGoal": "Appropriate campaign goal for these candidates",
  "suggestedName": "Suggested campaign name (3-6 words)"
}

GUIDELINES:
1. Target audience should describe the type of professionals being sought
2. Campaign goal should be specific and actionable
3. Campaign name should be professional and descriptive
4. Focus on healthcare recruitment context when applicable`;

  try {
    console.log('📤 Sending campaign context generation request to OpenAI...');
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
          content: searchQuery
        }
      ],
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean and parse the response
    const cleanedResponse = cleanJsonResponse(response);
    const result = parseJsonSafely(cleanedResponse);
    
    console.log('✅ Campaign context generated:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error generating campaign context:', error);
    
    // Fallback context
    return {
      targetAudience: 'Healthcare professionals matching the search criteria',
      campaignGoal: 'Engage qualified candidates for current and future opportunities',
      suggestedName: 'Healthcare Talent Outreach'
    };
  }
}

// Function to select appropriate collateral for a campaign based on campaign type and goal
async function selectCollateralForCampaign(
  collateral: CompanyCollateral[],
  campaignType: string,
  campaignGoal: string
): Promise<CompanyCollateral[]> {
  console.log('🔍 Selecting appropriate collateral for campaign');
  console.log('📊 Campaign type:', campaignType);
  console.log('🎯 Campaign goal:', campaignGoal);
  
  if (!collateral || collateral.length === 0) {
    console.log('⚠️ No collateral available to select from');
    return [];
  }
  
  // Get AI configuration
  const modelConfig = getAIModelForTask('campaignGeneration');
  
  const systemPrompt = `You are an expert recruitment marketer. Given a list of company collateral items and campaign details, select the most appropriate items to include in the campaign.

The campaign type and goal will be provided, along with a list of available collateral items.

Return a JSON array of collateral item indices that would be most effective for this campaign. For example:
[0, 2, 5]

GUIDELINES:
1. Select 2-4 items that best match the campaign type and goal
2. For nurture campaigns, focus on company culture, values, and benefits
3. For enrichment campaigns, focus on educational content and industry information
4. For keep-warm campaigns, focus on benefits and opportunities
5. For reengage campaigns, focus on new developments and compelling benefits
6. Always include mission statements for any campaign type if available
7. Return ONLY the array of indices, nothing else`;

  try {
    console.log('📤 Sending collateral selection request to OpenAI...');
    
    const collateralList = collateral.map((item, index) => 
      `${index}. Type: ${item.type}, Content: "${item.content.substring(0, 100)}${item.content.length > 100 ? '...' : ''}"`
    ).join('\n');
    
    const completion = await openai.chat.completions.create({
      model: modelConfig.model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Campaign Type: ${campaignType}
Campaign Goal: ${campaignGoal}

Available Collateral:
${collateralList}

Select the most appropriate collateral items for this campaign.`
        }
      ],
      temperature: 0.3,
      max_tokens: 100
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the response to get the selected indices
    let selectedIndices: number[] = [];
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      selectedIndices = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(selectedIndices)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('❌ Error parsing selected indices:', parseError);
      
      // Try to extract numbers from the response as a fallback
      const numberMatches = response.match(/\d+/g);
      if (numberMatches) {
        selectedIndices = numberMatches.map(Number).filter(n => n < collateral.length);
      }
    }
    
    // Ensure we have valid indices
    selectedIndices = selectedIndices.filter(i => i >= 0 && i < collateral.length);
    
    // If no valid indices, use a fallback selection
    if (selectedIndices.length === 0) {
      console.log('⚠️ No valid indices selected, using fallback selection');
      
      // Find mission statement if available
      const missionIndex = collateral.findIndex(item => item.type === 'mission_statements');
      if (missionIndex >= 0) selectedIndices.push(missionIndex);
      
      // Find benefits if available
      const benefitsIndex = collateral.findIndex(item => item.type === 'benefits');
      if (benefitsIndex >= 0) selectedIndices.push(benefitsIndex);
      
      // Add one more item based on campaign type
      if (campaignType === 'nurture') {
        const whoWeAreIndex = collateral.findIndex(item => item.type === 'who_we_are');
        if (whoWeAreIndex >= 0) selectedIndices.push(whoWeAreIndex);
      } else if (campaignType === 'enrichment') {
        const newslettersIndex = collateral.findIndex(item => item.type === 'newsletters');
        if (newslettersIndex >= 0) selectedIndices.push(newslettersIndex);
      } else if (campaignType === 'reengage') {
        const deiIndex = collateral.findIndex(item => item.type === 'dei_statements');
        if (deiIndex >= 0) selectedIndices.push(deiIndex);
      }
    }
    
    // Get the selected collateral items
    const selectedCollateral = selectedIndices.map(index => collateral[index]);
    
    console.log('✅ Selected collateral items:', selectedCollateral.length);
    return selectedCollateral;
    
  } catch (error) {
    console.error('❌ Error selecting collateral:', error);
    
    // Fallback: return a reasonable subset of collateral
    console.log('🔄 Using fallback collateral selection');
    
    // Try to find the most important types
    const missionStatement = collateral.find(item => item.type === 'mission_statements');
    const benefits = collateral.find(item => item.type === 'benefits');
    const whoWeAre = collateral.find(item => item.type === 'who_we_are');
    
    const result = [
      missionStatement,
      benefits,
      whoWeAre
    ].filter(Boolean) as CompanyCollateral[];
    
    // If we still don't have enough, add the first few items
    if (result.length < 2 && collateral.length > 0) {
      const additionalItems = collateral.filter(item => !result.includes(item)).slice(0, 2);
      result.push(...additionalItems);
    }
    
    return result;
  }
}