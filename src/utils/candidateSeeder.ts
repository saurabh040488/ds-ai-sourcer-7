import { bulkCreateCandidates, DatabaseCandidate } from '../lib/supabase';

// Generate 100 diverse healthcare candidates
const generateCandidates = (projectId: string): Omit<DatabaseCandidate, 'id' | 'created_at' | 'updated_at'>[] => {
  const jobTitles = [
    'Registered Nurse', 'Clinical Nurse Specialist', 'Nurse Practitioner', 'Emergency Room Nurse',
    'Licensed Practical Nurse', 'Healthcare Administrator', 'Director of Nursing', 'Surgical Technologist',
    'Medical Assistant', 'Physical Therapist', 'Occupational Therapist', 'Respiratory Therapist',
    'Pharmacist', 'Radiologic Technologist', 'Laboratory Technician', 'Social Worker',
    'Case Manager', 'Nurse Manager', 'Clinical Coordinator', 'Patient Care Coordinator',
    'Charge Nurse', 'Staff Nurse', 'ICU Nurse', 'Pediatric Nurse', 'Oncology Nurse',
    'Cardiac Nurse', 'Operating Room Nurse', 'Recovery Room Nurse', 'Home Health Nurse',
    'School Nurse', 'Occupational Health Nurse', 'Infection Control Nurse', 'Quality Assurance Nurse',
    'Nurse Educator', 'Clinical Research Nurse', 'Psychiatric Nurse', 'Geriatric Nurse',
    'Neonatal Nurse', 'Dialysis Technician', 'EKG Technician', 'Ultrasound Technician'
  ];

  const locations = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
    'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
    'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
    'San Francisco, CA', 'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Washington, DC',
    'Boston, MA', 'El Paso, TX', 'Nashville, TN', 'Detroit, MI', 'Oklahoma City, OK',
    'Portland, OR', 'Las Vegas, NV', 'Memphis, TN', 'Louisville, KY', 'Baltimore, MD',
    'Milwaukee, WI', 'Albuquerque, NM', 'Tucson, AZ', 'Fresno, CA', 'Sacramento, CA',
    'Kansas City, MO', 'Mesa, AZ', 'Atlanta, GA', 'Omaha, NE', 'Colorado Springs, CO',
    'Raleigh, NC', 'Miami, FL', 'Virginia Beach, VA', 'Oakland, CA', 'Minneapolis, MN',
    'Tulsa, OK', 'Arlington, TX', 'Tampa, FL', 'New Orleans, LA', 'Wichita, KS'
  ];

  const skillSets = [
    ['Critical Care', 'Patient Assessment', 'Emergency Response', 'Medical Records', 'IV Therapy'],
    ['Pediatric Care', 'Child Development', 'Family Education', 'Immunizations', 'Growth Monitoring'],
    ['Oncology', 'Chemotherapy Administration', 'Pain Management', 'Patient Education', 'Clinical Research'],
    ['Emergency Medicine', 'Trauma Care', 'Triage', 'Crisis Management', 'Advanced Life Support'],
    ['Surgical Procedures', 'Sterile Technique', 'Operating Room Protocols', 'Instrument Handling', 'Patient Positioning'],
    ['Geriatric Care', 'Dementia Care', 'Fall Prevention', 'Medication Management', 'End-of-Life Care'],
    ['Mental Health', 'Crisis Intervention', 'Therapeutic Communication', 'Behavioral Assessment', 'Group Therapy'],
    ['Cardiac Care', 'EKG Interpretation', 'Cardiac Monitoring', 'Chest Pain Assessment', 'Heart Failure Management'],
    ['Respiratory Care', 'Ventilator Management', 'Oxygen Therapy', 'Pulmonary Function', 'Airway Management'],
    ['Infection Control', 'Isolation Procedures', 'Sterilization', 'Disease Prevention', 'Outbreak Management'],
    ['Quality Improvement', 'Data Analysis', 'Process Improvement', 'Risk Assessment', 'Compliance Monitoring'],
    ['Leadership', 'Team Management', 'Staff Development', 'Budget Management', 'Strategic Planning'],
    ['Electronic Health Records', 'Healthcare Technology', 'Data Entry', 'System Training', 'Workflow Optimization'],
    ['Patient Education', 'Health Promotion', 'Discharge Planning', 'Care Coordination', 'Family Support'],
    ['Bilingual Spanish', 'Cultural Competency', 'Translation Services', 'Community Outreach', 'Diversity Training']
  ];

  const educationLevels = [
    'ADN - Associate Degree in Nursing',
    'BSN - Bachelor of Science in Nursing',
    'MSN - Master of Science in Nursing',
    'DNP - Doctor of Nursing Practice',
    'PhD - Doctor of Philosophy in Nursing',
    'Certificate - Licensed Practical Nurse',
    'Certificate - Medical Assistant',
    'Certificate - Surgical Technology',
    'BS - Bachelor of Science in Health Sciences',
    'MS - Master of Science in Healthcare Administration',
    'MBA - Master of Business Administration in Healthcare',
    'DPT - Doctor of Physical Therapy',
    'OTD - Doctor of Occupational Therapy',
    'PharmD - Doctor of Pharmacy',
    'AS - Associate of Science in Radiologic Technology'
  ];

  const availabilityOptions: ('available' | 'passive' | 'not-looking')[] = ['available', 'passive', 'not-looking'];
  const sources = ['LinkedIn', 'Career Site', 'Referral', 'Job Board', 'Hiring Event', 'Social Media', 'Direct Contact'];

  const firstNames = [
    'Sarah', 'Michael', 'Emma', 'David', 'Jennifer', 'Robert', 'Anna', 'Maria', 'James', 'Lisa',
    'Christopher', 'Jessica', 'Daniel', 'Ashley', 'Matthew', 'Amanda', 'Anthony', 'Melissa', 'Mark', 'Deborah',
    'Donald', 'Rachel', 'Steven', 'Carolyn', 'Paul', 'Janet', 'Andrew', 'Catherine', 'Joshua', 'Frances',
    'Kenneth', 'Christine', 'Kevin', 'Samantha', 'Brian', 'Debra', 'George', 'Rachel', 'Timothy', 'Cynthia',
    'Ronald', 'Kathleen', 'Jason', 'Amy', 'Edward', 'Angela', 'Jeffrey', 'Brenda', 'Ryan', 'Emma',
    'Jacob', 'Olivia', 'Gary', 'Cynthia', 'Nicholas', 'Marie', 'Eric', 'Janet', 'Jonathan', 'Catherine',
    'Stephen', 'Frances', 'Larry', 'Christine', 'Justin', 'Samantha', 'Scott', 'Deborah', 'Brandon', 'Rachel'
  ];

  const lastNames = [
    'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez',
    'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
    'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
    'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
    'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez',
    'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart',
    'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson'
  ];

  const candidates: Omit<DatabaseCandidate, 'id' | 'created_at' | 'updated_at'>[] = [];

  for (let i = 0; i < 100; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`;
    const phone = `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    const jobTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const experience = Math.floor(Math.random() * 15) + 3; // 3-17 years
    const skills = skillSets[Math.floor(Math.random() * skillSets.length)];
    const education = educationLevels[Math.floor(Math.random() * educationLevels.length)];
    const availability = availabilityOptions[Math.floor(Math.random() * availabilityOptions.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    // Generate realistic summary based on job title and experience
    const summaries = [
      `Experienced ${jobTitle.toLowerCase()} with ${experience} years in hospital settings, specializing in ${skills[0].toLowerCase()} and ${skills[1].toLowerCase()}.`,
      `Dedicated ${jobTitle.toLowerCase()} with ${experience} years of experience in ${skills[0].toLowerCase()}, known for excellent patient care and team collaboration.`,
      `Skilled ${jobTitle.toLowerCase()} with ${experience} years of clinical experience, expertise in ${skills[0].toLowerCase()} and ${skills[1].toLowerCase()}.`,
      `Compassionate ${jobTitle.toLowerCase()} with ${experience} years in healthcare, specializing in ${skills[0].toLowerCase()} and patient education.`,
      `Professional ${jobTitle.toLowerCase()} with ${experience} years of experience, strong background in ${skills[0].toLowerCase()} and quality improvement.`
    ];
    
    const summary = summaries[Math.floor(Math.random() * summaries.length)];
    
    // Generate last active date (within last 30 days)
    const lastActive = new Date();
    lastActive.setDate(lastActive.getDate() - Math.floor(Math.random() * 30));

    candidates.push({
      project_id: projectId,
      name,
      email,
      phone,
      job_title: jobTitle,
      location,
      experience,
      skills,
      industry: 'Healthcare',
      education,
      summary,
      availability,
      source,
      last_active: lastActive.toISOString(),
      metadata: {
        generated: true,
        batch: 'initial_seed'
      }
    });
  }

  return candidates;
};

export const seedCandidates = async (projectId: string) => {
  console.log('🌱 Seeding candidates for project:', projectId);
  
  try {
    const candidates = generateCandidates(projectId);
    console.log('📊 Generated', candidates.length, 'candidates');
    
    const { data, error } = await bulkCreateCandidates(candidates);
    
    if (error) {
      console.error('❌ Error seeding candidates:', error);
      throw error;
    }
    
    console.log('✅ Successfully seeded', data?.length || 0, 'candidates');
    return data;
  } catch (error) {
    console.error('❌ Error in seedCandidates:', error);
    throw error;
  }
};