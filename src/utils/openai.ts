import OpenAI from 'openai';
import { getAIModelForTask, getPromptForTask } from '../config/ai';
import { CompanyCollateral } from '../lib/supabase';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo purposes
});

// Logging utility for OpenAI interactions
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

export interface CampaignPrompt {
  campaignType: string;
  targetAudience: string;
  campaignGoal: string;
  contentSources: string[];
  aiInstructions: string;
  tone: string;
  emailLength?: 'short' | 'concise' | 'medium' | 'long';
  companyName: string;
  recruiterName: string;
}

export interface EmailStep {
  id: string;
  type: 'email' | 'connection';
  subject: string;
  content: string;
  delay: number;
  delayUnit: 'immediately' | 'business days';
}

export async function generateCampaignSequence(
  prompt: CampaignPrompt,
  relevantCompanyCollateral: CompanyCollateral[] = []
): Promise<EmailStep[]> {
  console.log('📧 Starting campaign sequence generation...');
  console.log('📊 Campaign Parameters:', prompt);
  console.log('📚 Using relevant company collateral:', relevantCompanyCollateral.length, 'items');

  // Get AI configuration for campaign generation
  const modelConfig = getAIModelForTask('campaignGeneration');
  const promptConfig = getPromptForTask('campaignGeneration');

  // Define email length specifications
  const emailLengthSpecs = {
    short: { range: '30-50 words', description: 'Brief and to the point' },
    concise: { range: '60-80 words', description: 'Balanced and focused' },
    medium: { range: '100-120 words', description: 'Detailed but readable' },
    long: { range: '150+ words', description: 'Comprehensive and thorough' }
  };

  const lengthSpec = emailLengthSpecs[prompt.emailLength || 'concise'];

  // Format company collateral for the prompt
  let collateralSection = '';
  if (relevantCompanyCollateral.length > 0) {
    collateralSection = `COMPANY KNOWLEDGE BASE (COLLATERAL):
The following company collateral should be integrated into the campaign emails:

${relevantCompanyCollateral.map((item, index) => {
  return `${index + 1}. Type: ${item.type}
   Content: ${item.content.substring(0, 300)}${item.content.length > 300 ? '...' : ''}
   Links: ${item.links.join(', ') || 'None'}`;
}).join('\n\n')}

COLLATERAL USAGE INSTRUCTIONS:
- For 'who_we_are', 'mission_statements', 'benefits', 'dei_statements', and 'newsletters': Integrate this content directly into the email body with proper HTML formatting
- For 'talent_community_link', 'career_site_link', and 'company_logo': Use as properly formatted HTML links and images
- Prioritize relevant collateral for each email step based on the email's purpose
- Maintain the specified tone and length while incorporating collateral
- Use collateral to enhance personalization and authenticity
`;
  } else {
    collateralSection = 'COMPANY KNOWLEDGE BASE (COLLATERAL):\nNo company collateral available for this campaign.\n';
  }

  // Prepare the system prompt with HTML email requirements
  const systemPrompt = promptConfig.system
    .replace('{lengthSpec.range}', lengthSpec.range)
    .replace('{lengthSpec.description}', lengthSpec.description)
    .replace('{tone}', prompt.tone);

  const userPrompt = `Generate the email sequence based on the provided parameters:

Campaign Type: ${prompt.campaignType}
Target Audience: ${prompt.targetAudience}
Campaign Goal: ${prompt.campaignGoal}
Company: ${prompt.companyName}
Recruiter: ${prompt.recruiterName}
Tone: ${prompt.tone}
Email Length: ${lengthSpec.range}

${collateralSection}

Content Sources:
${prompt.contentSources.join('\n')}

Additional Instructions:
${prompt.aiInstructions}

CRITICAL: Each email must be HTML-formatted with proper markup, including:
- Responsive table-based layout
- Inline CSS styling
- Proper text formatting (bold, italics, etc.)
- Organized bullet points or numbered lists
- Clickable hyperlinks with proper HTML anchor tags
- Clear heading hierarchy
- Proper paragraph spacing and formatting

Generate a sequence of HTML emails that follow email design best practices.`;

  try {
    console.log('📤 Sending campaign generation request to OpenAI...');
    console.log('🔧 Using model:', modelConfig.model, 'with config:', modelConfig);
    
    // Add detailed logging of the exact prompts being sent to the LLM
    console.group('🔍 DETAILED LLM PROMPT LOGGING');
    console.log('System Prompt:');
    console.log(systemPrompt);
    console.log('\nUser Prompt:');
    console.log(userPrompt);
    console.groupEnd();
    
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

    // Log the AI interaction
    logAIInteraction('Campaign Generation', 
      `System: ${systemPrompt}\n\nUser: ${userPrompt}`, 
      response,
      {
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        usage: completion.usage,
        campaignType: prompt.campaignType,
        emailLength: prompt.emailLength || 'concise',
        collateralCount: relevantCompanyCollateral.length
      }
    );

    // Parse the JSON response
    const emailData = JSON.parse(response);
    
    // Convert to EmailStep format with proper validation
    const emailSteps: EmailStep[] = emailData.map((email: any, index: number) => {
      // Ensure delayUnit is valid
      let delayUnit: 'immediately' | 'business days' = 'business days';
      if (index === 0) {
        delayUnit = 'immediately';
      } else if (email.delayUnit === 'immediately' || email.delayUnit === 'business days') {
        delayUnit = email.delayUnit;
      }

      return {
        id: `step-${index + 1}`,
        type: (email.type === 'connection' ? 'connection' : 'email') as 'email' | 'connection',
        subject: email.subject || `Follow-up ${index + 1}`,
        content: email.content || 'Email content here...',
        delay: Math.max(0, parseInt(email.delay) || (index === 0 ? 0 : index * 2)),
        delayUnit: delayUnit
      };
    });

    console.log('✅ Campaign sequence generated successfully:', emailSteps);
    return emailSteps;
    
  } catch (error) {
    logError('Campaign Generation', error, { prompt });
    
    console.log('🔄 Falling back to default sequence...');
    // Fallback to default sequence if API fails
    
    // Get email length specifications
    const emailLengthSpecs = {
      short: { minWords: 30, maxWords: 50 },
      concise: { minWords: 60, maxWords: 80 },
      medium: { minWords: 100, maxWords: 120 },
      long: { minWords: 150, maxWords: 200 }
    };
    
    const lengthSpec = emailLengthSpecs[prompt.emailLength || 'concise'];
    
    // Create email content based on length preference and incorporate company collateral
    const createEmailContent = (index: number, title: string): string => {
      // Extract company information from collateral
      let companyInfo = '';
      let companyBenefits = '';
      let companyMission = '';
      let talentCommunityLink = '';
      let careerSiteLink = '';
      
      if (relevantCompanyCollateral.length > 0) {
        // Extract who_we_are content
        const whoWeAre = relevantCompanyCollateral.find(item => item.type === 'who_we_are');
        if (whoWeAre) {
          companyInfo = whoWeAre.content.substring(0, 150);
        }
        
        // Extract benefits content
        const benefits = relevantCompanyCollateral.find(item => item.type === 'benefits');
        if (benefits) {
          companyBenefits = benefits.content.substring(0, 150);
        }
        
        // Extract mission statements
        const mission = relevantCompanyCollateral.find(item => item.type === 'mission_statements');
        if (mission) {
          companyMission = mission.content.substring(0, 150);
        }
        
        // Extract links
        const talentLink = relevantCompanyCollateral.find(item => item.type === 'talent_community_link');
        if (talentLink) {
          talentCommunityLink = talentLink.content;
        }
        
        const careerLink = relevantCompanyCollateral.find(item => item.type === 'career_site_link');
        if (careerLink) {
          careerSiteLink = careerLink.content;
        }
      }
      
      // Create HTML email template
      return `<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
  <tr>
    <td style="padding: 20px;">
      <h2 style="color: #333; font-size: 20px; margin: 0 0 15px 0;">Hi {{First Name}},</h2>
      
      <p style="color: #555; font-size: 16px; margin: 0 0 15px 0;">
        ${title} at <strong style="color: #333;">{{Company Name}}</strong>.
      </p>
      
      <p style="color: #555; font-size: 16px; margin: 0 0 15px 0;">
        ${prompt.aiInstructions || 'We have exciting opportunities that align with your background and career goals.'}
      </p>
      
      ${index === 0 && companyInfo ? `
      <p style="color: #555; font-size: 16px; margin: 0 0 15px 0;">
        ${companyInfo}
      </p>
      ` : ''}
      
      ${index === 1 && companyMission ? `
      <p style="color: #555; font-size: 16px; margin: 0 0 15px 0;">
        ${companyMission}
      </p>
      ` : ''}
      
      ${index === 2 && companyBenefits ? `
      <div style="margin: 15px 0;">
        <p style="color: #555; font-size: 16px; margin: 0 0 10px 0;">Our benefits include:</p>
        <ul style="color: #555; font-size: 16px; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">${companyBenefits}</li>
        </ul>
      </div>
      ` : ''}
      
      ${index === 0 ? `
      <p style="color: #555; font-size: 16px; margin: 15px 0;">
        Would you be interested in exploring opportunities with us?
      </p>
      ` : index === 1 ? `
      <p style="color: #555; font-size: 16px; margin: 15px 0;">
        I'd love to discuss how your experience at <strong style="color: #333;">{{Current Company}}</strong> could be valuable to our team.
      </p>
      ` : `
      <p style="color: #555; font-size: 16px; margin: 15px 0;">
        Would you be available for a brief conversation this week?
      </p>
      `}
      
      ${(talentCommunityLink && index === 2) ? `
      <div style="margin: 20px 0;">
        <a href="${talentCommunityLink}" style="display: inline-block; padding: 10px 20px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Join Our Talent Community</a>
      </div>
      ` : (careerSiteLink ? `
      <p style="color: #555; font-size: 16px; margin: 15px 0;">
        Learn more about opportunities at ${prompt.companyName}: <a href="${careerSiteLink}" style="color: #0066cc; text-decoration: none; font-weight: bold;">View Career Site</a>
      </p>
      ` : '')}
      
      <p style="color: #555; font-size: 16px; margin: 15px 0 0 0;">
        Best regards,<br>
        <strong style="color: #333;">{{Your Name}}</strong>
      </p>
    </td>
  </tr>
</table>`;
    };
    
    const fallbackSequence: EmailStep[] = [
      {
        id: 'step-1',
        type: 'email',
        subject: '{{First Name}}, interested in a new opportunity?',
        content: createEmailContent(0, 'Opportunity'),
        delay: 0,
        delayUnit: 'immediately'
      },
      {
        id: 'step-2',
        type: 'email',
        subject: 'Following up on healthcare opportunities',
        content: createEmailContent(1, 'Follow-up'),
        delay: 3,
        delayUnit: 'business days'
      },
      {
        id: 'step-3',
        type: 'email',
        subject: 'Last follow-up - {{Company Name}} opportunities',
        content: createEmailContent(2, 'Final follow-up'),
        delay: 5,
        delayUnit: 'business days'
      }
    ];
    
    console.log('🔄 Using fallback sequence:', fallbackSequence);
    return fallbackSequence;
  }
}

export async function generateCampaignName(campaignType: string, targetAudience: string, campaignGoal: string): Promise<string> {
  console.log('📝 Generating campaign name...');
  console.log('📊 Parameters:', { campaignType, targetAudience, campaignGoal });

  // Get AI configuration for campaign naming
  const modelConfig = getAIModelForTask('campaignNaming');
  const promptConfig = getPromptForTask('campaignNaming');

  const userPrompt = `Campaign Type: ${campaignType}\nTarget Audience: ${targetAudience}\nGoal: ${campaignGoal}`;

  try {
    console.log('📤 Sending campaign name generation request to OpenAI...');
    console.log('🔧 Using model:', modelConfig.model);
    
    // Add detailed logging of the exact prompts being sent to the LLM
    console.group('🔍 DETAILED LLM PROMPT LOGGING - CAMPAIGN NAME');
    console.log('System Prompt:');
    console.log(promptConfig.system);
    console.log('\nUser Prompt:');
    console.log(userPrompt);
    console.groupEnd();
    
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

    const response = completion.choices[0]?.message?.content?.trim();
    
    // Log the AI interaction
    logAIInteraction('Campaign Name Generation', 
      `System: ${promptConfig.system}\n\nUser: ${userPrompt}`, 
      response || 'No response',
      {
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens,
        usage: completion.usage
      }
    );

    const result = response || `${campaignType} Campaign`;
    console.log('✅ Campaign name generated:', result);
    return result;
    
  } catch (error) {
    logError('Campaign Name Generation', error, { campaignType, targetAudience, campaignGoal });
    
    const fallbackName = `${campaignType} Campaign`;
    console.log('🔄 Using fallback name:', fallbackName);
    return fallbackName;
  }
}