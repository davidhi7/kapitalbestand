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
('2024-01-01', NULL, 2, true, 120000, 'Apartment rent', 16, NULL),
('2024-01-01', '2024-12-01', 2, true, 2500, 'Phone bill', 18, NULL),
('2023-09-01', NULL, 2, false, 560000, 'Monthly salary', 17, 19),
('2024-02-01', '2024-07-01', 2, true, 15000, 'Streaming services', 18, NULL),

-- Edge cases for monthly transactions
('2024-02-01', '2024-02-01', 1, true, 5000, 'Single month expense', 4, 6), -- Same start and end month
('2020-01-01', '2023-12-01', 1, true, 95000, 'Long-term subscription', 4, NULL), -- Very long duration
('2024-12-01', NULL, 1, false, 200000, 'End of year recurring', 4, 6), -- Starting at end of year
('2024-01-15', '2024-06-15', 1, true, 3400, 'Mid-month to mid-month', 4, NULL); -- Non-standard month boundaries
