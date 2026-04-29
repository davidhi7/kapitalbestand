-- Insert comprehensive oneoff_transactions with various patterns
INSERT INTO oneoff_transactions (date, user_id, is_expense, amount, description, category_id, shop_id) VALUES 
-- Alice's transactions (varied amounts, dates, and patterns)
('2024-01-15', 1, true, 8542, 'Weekly grocery shopping', 1, 1),
('2024-01-15', 1, true, 12750, 'Lunch meeting with client', 2, 4),
('2024-01-16', 1, true, 4532, 'Gas for road trip', 3, 5),
('2024-01-20', 1, true, 1599, 'Monthly Netflix subscription', 4, 6),
('2024-01-25', 1, true, 15678, 'Winter coat', 7, 7),
('2024-01-28', 1, true, 12500, 'Doctor visit copay', 6, 9),
('2024-02-01', 1, false, 450000, 'Monthly salary', 10, 12),
('2024-02-05', 1, true, 23456, 'Flight to conference', 8, 10),
('2024-02-10', 1, false, 75000, 'Freelance project payment', 11, 13),
('2024-02-14', 1, true, 8900, 'Valentine''s dinner', 2, 2),
('2024-02-15', 1, false, 25000, 'Stock dividend', 12, 14),
('2024-02-20', 1, false, 50000, 'Birthday gift from parents', 13, 15),
('2024-02-25', 1, true, 19900, 'Online course', 9, 11),
('2024-03-01', 1, false, 450000, 'Monthly salary', 10, 12),
('2024-03-05', 1, true, 156789, 'New laptop for work', 7, 7),
('2024-03-10', 1, true, 3421, 'Prescription medication', 6, 9),
('2024-03-15', 1, true, 67890, 'Weekend getaway hotel', 8, NULL),
('2024-03-20', 1, true, 5632, 'Grocery shopping', 1, 2),
('2024-03-25', 1, true, 892, 'Coffee and pastry', 2, 4),

-- Bob's transactions (simpler pattern, different amounts)
('2024-01-01', 2, true, 15000, 'New Year groceries', 14, 16),
('2024-01-05', 2, true, 6000, 'Gas fillup', 15, 17),
('2024-01-10', 2, true, 120000, 'Monthly rent', 16, NULL),
('2024-01-15', 2, false, 280000, 'Bi-weekly paycheck', 17, 19),
('2024-01-20', 2, true, 2500, 'Pizza delivery', 14, 18),
('2024-01-31', 2, false, 280000, 'Bi-weekly paycheck', 17, 19),
('2024-02-01', 2, true, 120000, 'Monthly rent', 16, NULL),
('2024-02-05', 2, true, 18000, 'Grocery shopping', 14, 16),
('2024-02-15', 2, false, 280000, 'Bi-weekly paycheck', 17, 19),
('2024-02-20', 2, true, 7500, 'Gas and snacks', 15, 17),
('2024-02-28', 2, false, 280000, 'Bi-weekly paycheck', 17, 19),

-- Additional transactions for testing edge cases
('2023-12-31', 1, true, 1, 'Year-end penny transaction', 10, NULL),
('2025-01-01', 1, false, 999999999, 'Future large income', 10, 12),
('2024-06-15', 2, true, 0, 'Zero amount test', 10, NULL),
('2024-02-29', 1, true, 2900, 'Leap year transaction', 1, 1);
