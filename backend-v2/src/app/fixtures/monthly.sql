-- Insert monthly_transactions with various patterns
INSERT INTO monthly_transactions (month_from, month_to, user_id, is_expense, amount, description, category_id, shop_id) VALUES 
-- Alice's recurring transactions
('2024-01-01', '2024-12-01', 1, true, 1599, 'Netflix subscription', 4, 6),
('2024-01-01', '2024-06-01', 1, true, 12000, 'Gym membership', 4, NULL),
('2024-02-01', NULL, 1, true, 89000, 'Car insurance', 3, NULL),
('2023-06-01', '2024-05-01', 1, true, 45000, 'Phone plan', 5, NULL),
('2024-01-01', NULL, 1, false, 450000, 'Base salary', 10, 12),
('2024-03-01', '2024-08-01', 1, false, 75000, 'Freelance retainer', 11, 13),

-- Bob's recurring transactions
('2024-01-01', NULL, 2, true, 120000, 'Apartment rent', 8, NULL),
('2024-01-01', '2024-12-01', 2, true, 2500, 'Phone bill', 10, NULL),
('2023-09-01', NULL, 2, false, 560000, 'Monthly salary', 9, 19),
('2024-02-01', '2024-07-01', 2, true, 15000, 'Streaming services', 10, NULL),

-- Charlie's business recurring
('2024-01-01', NULL, 3, true, 67000, 'Office rent', 21, NULL),
('2024-01-01', '2024-12-01', 3, true, 12000, 'Software subscriptions', 21, NULL),
('2023-11-01', NULL, 3, false, 180000, 'Client Alpha retainer', 25, 27),
('2024-02-01', '2024-11-01', 3, false, 145000, 'Client Beta monthly', 25, 28),

-- Diana's recurring
('2024-01-01', NULL, 4, true, 450, 'Monthly bus pass', 27, 30),
('2023-08-01', NULL, 4, false, 320000, 'Salary', 28, 31),
('2024-01-01', '2024-06-01', 4, true, 8900, 'Gym membership', 26, NULL),

-- Eve's minimal recurring
('2024-01-01', '2024-03-01', 5, true, 1000, 'Something monthly', 29, NULL),

-- Edge cases for monthly transactions
('2024-02-01', '2024-02-01', 1, true, 5000, 'Single month expense', 1, 1), -- Same start and end month
('2020-01-01', '2023-12-01', 2, true, 95000, 'Long-term subscription', 10, NULL), -- Very long duration
('2024-12-01', NULL, 3, false, 200000, 'End of year recurring', 24, 27), -- Starting at end of year
('2024-01-15', '2024-06-15', 4, true, 3400, 'Mid-month to mid-month', 26, NULL); -- Non-standard month boundaries
