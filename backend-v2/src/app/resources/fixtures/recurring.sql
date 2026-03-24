-- Insert monthly_transactions with various patterns
INSERT INTO recurring_transactions (frequency, interval_from, interval_to, user_id, is_expense, amount, description, category_id, shop_id) VALUES 
-- Alice's recurring transactions
('monthly', '2024-01-01', '2024-12-01', 1, true, 1599, 'Netflix subscription', 4, 6),
('monthly', '2024-01-01', '2024-06-01', 1, true, 12000, 'Gym membership', 4, NULL),
('monthly', '2024-02-01', NULL, 1, true, 89000, 'Car insurance', 3, NULL),
('monthly', '2023-06-01', '2024-05-01', 1, true, 45000, 'Phone plan', 5, NULL),
('monthly', '2024-01-01', NULL, 1, false, 450000, 'Base salary', 10, 12),
('monthly', '2024-03-01', '2024-08-01', 1, false, 75000, 'Freelance retainer', 11, 13),

-- Bob's recurring transactions
('monthly', '2024-01-01', NULL, 2, true, 120000, 'Apartment rent', 16, NULL),
('monthly', '2024-01-01', '2024-12-01', 2, true, 2500, 'Phone bill', 18, NULL),
('monthly', '2023-09-01', NULL, 2, false, 560000, 'Monthly salary', 17, 19),
('monthly', '2024-02-01', '2024-07-01', 2, true, 15000, 'Streaming services', 18, NULL),

-- Edge cases for monthly transactions
('monthly', '2024-02-01', '2024-02-01', 1, true, 5000, 'Single month expense', 4, 6), -- Same start and end month
('monthly', '2020-01-01', '2023-12-01', 1, true, 95000, 'Long-term subscription', 4, NULL), -- Very long duration
('monthly', '2024-12-01', NULL, 1, false, 200000, 'End of year recurring', 4, 6), -- Starting at end of year

-- Some yearly transactions
('yearly', '2024-01-01', '2025-01-01', 1, true, 10000, 'Yearly christmas gifts', 13, NULL),
('yearly', '2024-01-01', NULL, 1, true, 5000, 'Yearly restaurant visit', 2, 2);
