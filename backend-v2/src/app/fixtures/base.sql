-- Create test users with different characteristics
INSERT INTO users (username, hash) VALUES 
('alice_admin', 'hash1'),
('bob_user', 'hash2'),
('charlie_test', 'hash3'),
('diana_demo', 'hash4'),
('eve_inactive', 'hash5');

-- Insert diverse categories for different users
INSERT INTO categories (name, user_id) VALUES 
-- Alice's categories (comprehensive set)
('Groceries', 1),
('Restaurants', 1),
('Transportation', 1),
('Entertainment', 1),
('Utilities', 1),
('Healthcare', 1),
('Shopping', 1),
('Travel', 1),
('Education', 1),
('Salary', 1),
('Freelance', 1),
('Investments', 1),
('Gifts Received', 1),
-- Bob's categories (basic set)
('Food', 2),
('Gas', 2),
('Rent', 2),
('Income', 2),
('Misc', 2),
-- Charlie's categories (business focused)
('Office Supplies', 3),
('Marketing', 3),
('Equipment', 3),
('Revenue', 3),
('Consulting', 3),
-- Diana's categories (overlapping names with different users)
('Groceries', 4),
('Transportation', 4),
('Income', 4),
-- Eve's categories (minimal)
('Expenses', 5),
('Money In', 5);

-- Insert diverse shops
INSERT INTO shops (name, user_id) VALUES 
-- Alice's shops
('Whole Foods', 1),
('Trader Joes', 1),
('McDonald''s', 1),
('Starbucks', 1),
('Shell Station', 1),
('Netflix', 1),
('Amazon', 1),
('Target', 1),
('CVS Pharmacy', 1),
('Delta Airlines', 1),
('Coursera', 1),
('TechCorp Inc', 1),
('Upwork Client A', 1),
('Robinhood', 1),
('Mom & Dad', 1),
-- Bob's shops
('Local Grocery', 2),
('Gas Station', 2),
('Pizza Place', 2),
('My Company', 2),
-- Charlie's shops
('Office Depot', 3),
('Google Ads', 3),
('Best Buy', 3),
('Client Alpha', 3),
('Client Beta', 3),
-- Diana's shops
('Supermarket Chain', 4),
('Bus Company', 4),
('Employer XYZ', 4),
-- Eve's shops
('Corner Store', 5),
('ATM', 5);

