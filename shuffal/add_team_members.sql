-- Add/Update Team Members with Verified Status and Roles
-- Run this in Supabase SQL Editor

-- Update Pushpendra Maury - Vice President
UPDATE users 
SET role = 'vice_president', is_verified = true
WHERE LOWER(name) LIKE '%pushpendra%' 
  OR email = 'mauryapushpendra6@gmail.com';

-- Update Siddhart - Treasurer
UPDATE users 
SET role = 'treasurer', is_verified = true
WHERE LOWER(name) LIKE '%siddhart%'
  OR email = 'siddharthsahu9956@gmail.com';

-- Update Yashashvi - Year Representative
UPDATE users 
SET role = 'year_representative', is_verified = true
WHERE LOWER(name) LIKE '%yashashvi%'
  OR email = 'yashkumar8497@gmail.com';

-- Update Ayush - Year Representative
UPDATE users 
SET role = 'year_representative', is_verified = true
WHERE LOWER(name) LIKE '%ayush%'
  OR email = 'ayush89p87@gmail.com';
