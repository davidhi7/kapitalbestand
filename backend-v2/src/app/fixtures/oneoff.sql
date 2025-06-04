-- Insert comprehensive oneoff_transactions with various patterns
INSERT INTO oneoff_transactions (date, user_id, is_expense, amount, description, category_id, shop_id) VALUES 
-- Alice's transactions (varied amounts, dates, and patterns)
('2024-01-15', 1, true, 8542, 'Weekly grocery shopping', 1, 1),
('2024-01-15', 1, true, 12750, 'Lunch meeting with client', 2, 4),
('2024-01-16', 1, true, 4532, 'Gas for road trip', 3, 5),
('2024-01-20', 1, true, 1599, 'Monthly Netflix subscription', 4, 6),
('2024-01-25', 1, true, 15678, 'Winter coat', 7, 9),
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
('2024-01-01', 2, true, 15000, 'New Year groceries', 6, 16),
('2024-01-05', 2, true, 6000, 'Gas fillup', 7, 17),
('2024-01-10', 2, true, 120000, 'Monthly rent', 8, NULL),
('2024-01-15', 2, false, 280000, 'Bi-weekly paycheck', 9, 19),
('2024-01-20', 2, true, 2500, 'Pizza delivery', 6, 18),
('2024-01-31', 2, false, 280000, 'Bi-weekly paycheck', 9, 19),
('2024-02-01', 2, true, 120000, 'Monthly rent', 8, NULL),
('2024-02-05', 2, true, 18000, 'Grocery shopping', 6, 16),
('2024-02-15', 2, false, 280000, 'Bi-weekly paycheck', 9, 19),
('2024-02-20', 2, true, 7500, 'Gas and snacks', 7, 17),
('2024-02-28', 2, false, 280000, 'Bi-weekly paycheck', 9, 19),

-- Charlie's business transactions
('2024-01-03', 3, true, 4500, 'Printer paper and pens', 21, 24),
('2024-01-10', 3, true, 45000, 'Google Ads campaign', 22, 25),
('2024-01-15', 3, false, 250000, 'Project Alpha milestone', 24, 27),
('2024-01-20', 3, true, 89000, 'New monitor setup', 23, 26),
('2024-01-25', 3, false, 180000, 'Consulting retainer', 25, 28),
('2024-02-01', 3, true, 3200, 'Office supplies restock', 21, 24),
('2024-02-10', 3, false, 320000, 'Project Beta completion', 24, 27),
('2024-02-15', 3, true, 67000, 'Marketing materials', 22, NULL),
('2024-02-28', 3, false, 180000, 'Monthly consulting', 25, 28),

-- Diana's transactions (overlapping categories but different user)
('2024-01-05', 4, true, 9500, 'Weekly shopping', 26, 29),
('2024-01-12', 4, true, 450, 'Bus pass', 27, 30),
('2024-01-31', 4, false, 320000, 'Salary payment', 28, 31),
('2024-02-02', 4, true, 11200, 'Grocery run', 26, 29),
('2024-02-15', 4, true, 850, 'Bus tickets', 27, 30),
('2024-02-29', 4, false, 320000, 'Salary payment', 28, 31),

-- Eve's minimal transactions
('2024-01-10', 5, true, 2000, NULL, 29, 32),
('2024-01-20', 5, false, 10000, 'Cash withdrawal', 30, 33),
('2024-02-10', 5, true, 1500, 'Snacks', 29, 32),

-- Additional transactions for testing edge cases
('2023-12-31', 1, true, 1, 'Year-end penny transaction', 10, NULL),
('2025-01-01', 1, false, 999999999, 'Future large income', 10, 12),
('2024-06-15', 2, true, 0, 'Zero amount test', 10, NULL),
('2024-02-29', 1, true, 2900, 'Leap year transaction', 1, 1);
