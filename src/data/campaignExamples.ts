import { CampaignExample } from '../types';

export const campaignExamples: CampaignExample[] = [
  {
    id: "talent-community-nurture",
    campaignGoal: "Build a vibrant talent community for healthcare professionals nationwide.",
    campaignType: "nurture",
    sequenceAndExamples: {
      steps: 4,
      duration: 8,
      description: "Welcome message, company intro, share benefits or news, highlight opportunities, invite to join community",
      examples: ["Welcome to HCA", "Benefits Overview", "Center Spotlight", "Join Talent Community"]
    },
    collateralToUse: ["Newsletters", "Benefits", "Who we are", "Mission statements", "DEI statements", "Talent community link", "Company logo", "Career site link"]
  },
  {
    id: "passive-candidate-nurture",
    campaignGoal: "Nurture passive candidates with regular industry insights.",
    campaignType: "nurture",
    sequenceAndExamples: {
      steps: 4,
      duration: 8,
      description: "Intro to HCA updates, share industry insights, offer long-term opportunities, stay connected prompt",
      examples: ["HCA Updates", "Industry Insights", "Upcoming Opportunities", "Stay Connected"]
    },
    collateralToUse: ["Newsletters", "Who we are", "Mission statements", "Career site link"]
  },
  {
    id: "company-culture-nurture",
    campaignGoal: "Introduce company culture to engage potential candidates.",
    campaignType: "nurture",
    sequenceAndExamples: {
      steps: 4,
      duration: 8,
      description: "Who we are intro, highlight values, day in the life, join us invite",
      examples: ["Who We Are", "Our Values", "Day in the Life", "Join Us"]
    },
    collateralToUse: ["Who we are", "Mission statements", "DEI statements", "Company logo"]
  },
  {
    id: "company-news-nurture",
    campaignGoal: "Keep candidates informed with the latest company news.",
    campaignType: "nurture",
    sequenceAndExamples: {
      steps: 4,
      duration: 8,
      description: "Latest news intro, industry trends, opportunity updates, stay informed prompt",
      examples: ["Latest News", "Trends Update", "Opportunity Alert", "Stay Informed"]
    },
    collateralToUse: ["Newsletters", "Who we are", "Career site link"]
  },
  {
    id: "virtual-events-nurture",
    campaignGoal: "Engage community members with virtual career events.",
    campaignType: "nurture",
    sequenceAndExamples: {
      steps: 4,
      duration: 8,
      description: "Event announcement, event details, registration prompt, follow-up invite",
      examples: ["Upcoming Event", "Event Details", "Register Now", "Join Next Event"]
    },
    collateralToUse: ["Newsletters", "Talent community link", "Company logo"]
  },
  {
    id: "benefits-highlight-nurture",
    campaignGoal: "Highlight benefits to inspire candidate interest.",
    campaignType: "nurture",
    sequenceAndExamples: {
      steps: 4,
      duration: 8,
      description: "Benefits intro, detailed benefits, role opportunities, join community invite",
      examples: ["Benefits Intro", "Detailed Benefits", "Role Spotlight", "Join Us"]
    },
    collateralToUse: ["Benefits", "Who we are", "Career site link"]
  },
  {
    id: "new-graduate-nurture",
    campaignGoal: "Nurture new talent with career guidance for fresh graduates.",
    campaignType: "nurture",
    sequenceAndExamples: {
      steps: 4,
      duration: 8,
      description: "Welcome to workforce, HCA opportunities, application tips, community join prompt",
      examples: ["Welcome to Workforce", "HCA Opportunities", "Application Tips", "Join Community"]
    },
    collateralToUse: ["Benefits", "Who we are", "Career site link", "Educational content"]
  },
  {
    id: "hiring-events-nurture",
    campaignGoal: "Promote engaging hiring events for community growth.",
    campaignType: "nurture",
    sequenceAndExamples: {
      steps: 4,
      duration: 8,
      description: "Event teaser, event agenda, registration call, community growth invite",
      examples: ["Event Teaser", "Event Agenda", "Register Now", "Grow with Us"]
    },
    collateralToUse: ["Newsletters", "Talent community link", "Company logo"]
  },
  {
    id: "social-media-nurture",
    campaignGoal: "Engage followers with impactful social media updates.",
    campaignType: "nurture",
    sequenceAndExamples: {
      steps: 4,
      duration: 8,
      description: "Social media intro, industry news, engagement prompt, follow us call",
      examples: ["Social Media Intro", "Industry News", "Engage with Us", "Follow Us"]
    },
    collateralToUse: ["Newsletters", "Who we are", "Social media content"]
  },
  {
    id: "career-tips-enrichment",
    campaignGoal: "Provide valuable career tips to enhance candidate profiles.",
    campaignType: "enrichment",
    sequenceAndExamples: {
      steps: 3,
      duration: 6,
      description: "Why update profile, how to update, benefits of updating",
      examples: ["Why Update Profile", "How to Update", "Benefits of Updating"]
    },
    collateralToUse: ["Who we are", "Career site link", "Educational content"]
  },
  {
    id: "peer-data-enrichment",
    campaignGoal: "Offer insightful peer data to guide job applications.",
    campaignType: "enrichment",
    sequenceAndExamples: {
      steps: 3,
      duration: 6,
      description: "Peer job trends, why these jobs, apply now prompt",
      examples: ["Peer Job Trends", "Why These Jobs", "Apply Now"]
    },
    collateralToUse: ["Job listings", "Career site link", "Peer application data"]
  },
  {
    id: "educational-content-enrichment",
    campaignGoal: "Provide educational content to boost candidate skills.",
    campaignType: "enrichment",
    sequenceAndExamples: {
      steps: 3,
      duration: 6,
      description: "Career tip intro, detailed guide, download resource",
      examples: ["Career Tip Intro", "Detailed Guide", "Download Resource"]
    },
    collateralToUse: ["Who we are", "Educational content", "Career site link"]
  },
  {
    id: "contacted-leads-keep-warm",
    campaignGoal: "Maintain engagement with contacted leads through personalized updates.",
    campaignType: "keep-warm",
    sequenceAndExamples: {
      steps: 2,
      duration: 4,
      description: "New jobs since contact, personalized message",
      examples: ["New Jobs Since Contact", "Personalized Message"]
    },
    collateralToUse: ["Job listings", "Personalized updates", "Career site link"]
  },
  {
    id: "job-alerts-keep-warm",
    campaignGoal: "Offer immediate job alerts for active job seekers.",
    campaignType: "keep-warm",
    sequenceAndExamples: {
      steps: 2,
      duration: 4,
      description: "Hot job alert, apply now prompt",
      examples: ["Hot Job Alert", "Apply Now"]
    },
    collateralToUse: ["Job listings", "Career site link"]
  },
  {
    id: "inactive-candidates-reengage",
    campaignGoal: "Reengage inactive candidates with exciting new job opportunities.",
    campaignType: "reengage",
    sequenceAndExamples: {
      steps: 3,
      duration: 5,
      description: "We're still interested, new opportunities, let's reconnect",
      examples: ["We're Still Interested", "New Opportunities", "Let's Reconnect"]
    },
    collateralToUse: ["Job listings", "Personalized messages"]
  },
  {
    id: "qualification-screener-reengage",
    campaignGoal: "Qualify potential hires through interactive screener questions.",
    campaignType: "reengage",
    sequenceAndExamples: {
      steps: 3,
      duration: 5,
      description: "Answer these questions, we'd love to know more, schedule a call",
      examples: ["Answer These Questions", "We'd Love to Know More", "Schedule a Call"]
    },
    collateralToUse: ["Qualification criteria", "Personalized messages"]
  },
  {
    id: "recruiter-interest-reengage",
    campaignGoal: "Reengage candidates with personalized recruiter interest.",
    campaignType: "reengage",
    sequenceAndExamples: {
      steps: 3,
      duration: 5,
      description: "Recruiters interested, profile summary, update profile",
      examples: ["Recruiters Interested", "Profile Summary", "Update Profile"]
    },
    collateralToUse: ["Personalized messages", "Profile data"]
  },
  {
    id: "competitor-targeting-nurture-reengage",
    campaignGoal: "Attract skilled employees from competitor healthcare organizations.",
    campaignType: "nurture-reengage",
    sequenceAndExamples: {
      steps: 4,
      duration: 8,
      description: "Why switch to HCA, benefits at HCA, success stories, apply now",
      examples: ["Why Switch to HCA", "Benefits at HCA", "Success Stories", "Apply Now"]
    },
    collateralToUse: ["Benefits", "Comparison charts", "Testimonials"]
  },
  {
    id: "licensed-professionals-nurture-reengage",
    campaignGoal: "Promote diverse job opportunities for licensed professionals.",
    campaignType: "nurture-reengage",
    sequenceAndExamples: {
      steps: 4,
      duration: 8,
      description: "Welcome to Florida HCA, benefits in Florida, specific jobs, apply now",
      examples: ["Welcome to Florida HCA", "Benefits in Florida", "Specific Jobs", "Apply Now"]
    },
    collateralToUse: ["Job listings", "Benefits", "Location-specific content"]
  },
  {
    id: "transitioning-employees-nurture-reengage",
    campaignGoal: "Support transitioning employees with tailored job options.",
    campaignType: "nurture-reengage",
    sequenceAndExamples: {
      steps: 4,
      duration: 8,
      description: "New beginnings at HCA, transition support, available roles, explore options",
      examples: ["New Beginnings at HCA", "Transition Support", "Available Roles", "Explore Options"]
    },
    collateralToUse: ["Job listings", "Transition support", "Benefits"]
  },
  {
    id: "critical-roles-nurture-reengage",
    campaignGoal: "Fill critical roles with targeted recruitment efforts.",
    campaignType: "nurture-reengage",
    sequenceAndExamples: {
      steps: 4,
      duration: 8,
      description: "The role at HCA, why it's great, meet the team, apply now",
      examples: ["The Role at HCA", "Why It's Great", "Meet the Team", "Apply Now"]
    },
    collateralToUse: ["Job listings", "Benefits", "Recruiter messages"]
  }
];

// Helper function to find campaign examples by type
export function getCampaignExamplesByType(type: string): CampaignExample[] {
  return campaignExamples.filter(example => example.campaignType === type);
}

// Helper function to find campaign example by ID
export function findCampaignExampleById(id: string): CampaignExample | null {
  return campaignExamples.find(example => example.id === id) || null;
}

// Helper function to find campaign example by goal (fuzzy matching)
export function findCampaignExampleByGoal(goal: string): CampaignExample | null {
  const lowerGoal = goal.toLowerCase();
  
  // First try exact match
  let match = campaignExamples.find(example => 
    example.campaignGoal.toLowerCase() === lowerGoal
  );
  
  if (match) return match;
  
  // Then try partial match
  match = campaignExamples.find(example => 
    example.campaignGoal.toLowerCase().includes(lowerGoal) ||
    lowerGoal.includes(example.campaignGoal.toLowerCase())
  );
  
  if (match) return match;
  
  // Finally try keyword matching
  const goalKeywords = lowerGoal.split(' ').filter(word => word.length > 3);
  match = campaignExamples.find(example => {
    const exampleKeywords = example.campaignGoal.toLowerCase().split(' ');
    return goalKeywords.some(keyword => 
      exampleKeywords.some(exampleWord => exampleWord.includes(keyword))
    );
  });
  
  return match || null;
}

// Helper function to get all unique campaign types
export function getCampaignTypes(): string[] {
  const types = new Set(campaignExamples.map(example => example.campaignType));
  return Array.from(types);
}

// Helper function to get all unique collateral types
export function getAllCollateralTypes(): string[] {
  const collateral = new Set<string>();
  campaignExamples.forEach(example => {
    example.collateralToUse.forEach(item => collateral.add(item));
  });
  return Array.from(collateral);
}