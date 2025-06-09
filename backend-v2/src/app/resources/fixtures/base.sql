-- Create test users with different characteristics
INSERT INTO users (username, hash) VALUES 
('alice_admin', 'hash1'),
('bob_user', 'hash2');

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
('Misc', 2);

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
('My Company', 2);
