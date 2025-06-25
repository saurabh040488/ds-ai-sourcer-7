/*
  # Add nurture-reengage campaign type

  1. Schema Changes
    - Update campaigns table type column to include 'nurture-reengage'
    - Modify the check constraint to allow the new campaign type
    
  2. Security
    - No changes to RLS policies needed
    - Existing policies will continue to work with new type
    
  3. Notes
    - This migration adds support for the new 'nurture-reengage' campaign type
    - Existing campaigns will not be affected
    - The new type supports hybrid nurture-reengage campaigns for competitor targeting
*/

-- Drop the existing check constraint
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_type_check;

-- Add the new check constraint with the additional 'nurture-reengage' type
ALTER TABLE campaigns ADD CONSTRAINT campaigns_type_check 
CHECK (type IN ('nurture', 'enrichment', 'keep-warm', 'reengage', 'nurture-reengage'));

-- Verify the constraint was added correctly
DO $$
BEGIN
  -- Test that all valid types are accepted
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'campaigns_type_check' 
    AND check_clause LIKE '%nurture-reengage%'
  ) THEN
    RAISE EXCEPTION 'Campaign type constraint was not updated correctly';
  END IF;
  
  RAISE NOTICE 'Campaign type constraint updated successfully to include nurture-reengage';
END $$;