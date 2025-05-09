

-- schema.sql: SQLite Database Schema


-- Users Table

CREATE TABLE IF NOT EXISTS users (

id INTEGER PRIMARY KEY AUTOINCREMENT,

username TEXT UNIQUE NOT NULL,

email TEXT UNIQUE NOT NULL,

password_hash TEXT NOT NULL,

avatar_url TEXT DEFAULT '',

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

updated_at DATETIME DEFAULT CURRENT_TIMESTAMP

);


-- Sessions Table

CREATE TABLE IF NOT EXISTS sessions (

id TEXT PRIMARY KEY,

user_id INTEGER NOT NULL,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

);


-- Index for faster session lookup

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);


-- Posts Table

CREATE TABLE IF NOT EXISTS posts (

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id INTEGER NOT NULL,

category_id INTEGER NOT NULL,

title TEXT NOT NULL,

content TEXT NOT NULL,

image_url TEXT,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL

);




-- Comments Table

CREATE TABLE IF NOT EXISTS comments (

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id INTEGER NOT NULL,

post_id INTEGER NOT NULL,

content TEXT NOT NULL,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE

);


-- Likes Table (Supports both post and comment likes)

CREATE TABLE IF NOT EXISTS likes (

user_id INTEGER NOT NULL,

post_id INTEGER,

comment_id INTEGER,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

PRIMARY KEY (user_id, post_id, comment_id),

FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,

FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE

);


-- Ensure the old trigger is removed before creating a new one

DROP TRIGGER IF EXISTS update_user_timestamp;

DROP TRIGGER IF EXISTS update_post_timestamp;

DROP TRIGGER IF EXISTS update_comment_timestamp;


-- Auto-update `updated_at` column in `users`

CREATE TRIGGER update_user_timestamp

AFTER UPDATE ON users

FOR EACH ROW

BEGIN

UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;

END;


-- Auto-update `updated_at` column in `posts`

CREATE TRIGGER update_post_timestamp

AFTER UPDATE ON posts

FOR EACH ROW

BEGIN

UPDATE posts SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;

END;


-- Auto-update `updated_at` column in `comments`

CREATE TRIGGER update_comment_timestamp

AFTER UPDATE ON comments

FOR EACH ROW

BEGIN

UPDATE comments SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;

END;


CREATE TABLE IF NOT EXISTS categories (

id INTEGER PRIMARY KEY AUTOINCREMENT,

name TEXT UNIQUE NOT NULL

);

-- BEGIN TRANSACTION;


-- -- Insert sample users


-- INSERT INTO users (username, email, password_hash, avatar_url) VALUES

-- ('john_dev', 'john@dev.com', '$2a$10$hashedpass1', '/static/pictures/icon1.png'),

-- ('jane_tech', 'jane@tech.com', '$2a$10$hashedpass2', '/static/pictures/icon3.png'),

-- ('alice_data', 'alice@data.com', '$2a$10$hashedpass3', '/static/pictures/icon5.png'),

-- ('bob_security', 'bob@security.com', '$2a$10$hashedpass4', '/static/pictures/icon7.png'),

-- ('emma_cloud', 'emma@cloud.com', '$2a$10$hashedpass5', '/static/pictures/icon9.png'),

-- ('mike_game', 'mike@game.com', '$2a$10$hashedpass6', '/static/pictures/icon2.png'),

-- ('sarah_ai', 'sarah@ai.com', '$2a$10$hashedpass7', '/static/pictures/icon4.png'),

-- ('james_arch', 'james@arch.com', '$2a$10$hashedpass8', '/static/pictures/icon6.png'),

-- ('lisa_mobile', 'lisa@mobile.com', '$2a$10$hashedpass9', '/static/pictures/icon8.png'),

-- ('david_block', 'david@block.com', '$2a$10$hashedpass10', '/static/pictures/icon10.png');


-- -- Insert sample categories


-- INSERT INTO categories (name) VALUES

-- ('Web Development'),

-- ('Mobile Development'),

-- ('Data Science'),

-- ('DevOps'),

-- ('Cybersecurity'),

-- ('Artificial Intelligence'),

-- ('Software Architecture'),

-- ('Game Development'),

-- ('Cloud Computing'),

-- ('Blockchain');




-- -- Insert sample posts


-- INSERT INTO posts (user_id, category_id, title, content, image_url) VALUES

-- (1, 2, 'iOS App Security', 'Mobile security guidelines...', '/static/pictures/post1.png'),

-- (2, 3, 'Python Data Visualization', 'Using matplotlib and seaborn...', '/static/pictures/post2.png'),

-- (3, 4, 'Docker Optimization', 'Container performance tips...', '/static/pictures/post3.png'),

-- (4, 5, 'Ethical Hacking Guide', 'Penetration testing basics...', '/static/pictures/post4.png'),

-- (5, 6, 'Neural Networks Explained', 'Deep learning fundamentals...', '/static/pictures/post5.png'),

-- (6, 7, 'API Design Patterns', 'REST and GraphQL best practices...', '/static/pictures/post6.png'),

-- (7, 8, 'Unreal Engine Tips', 'Game optimization techniques...', '/static/pictures/post7.png'),

-- (8, 9, 'Serverless Architecture', 'Building scalable functions...', '/static/pictures/post8.png'),

-- (9, 10, 'Smart Contract Security', 'Blockchain security patterns...', '/static/pictures/post9.png'),

-- (10, 1, 'TypeScript Advanced Types', 'Type system deep dive...', '/static/pictures/post10.png');


-- -- Insert sample likes on posts

-- INSERT INTO likes (user_id, post_id) VALUES 

-- (1, 2),
-- (3, 3),
-- (2, 2),
-- (3, 2),
-- (4, 2),
-- (5, 2),
-- (6, 2),
-- (7, 2),
-- (8, 2),
-- (3, 1),
-- (4, 3),
-- (5, 3),
-- (6, 3),
-- (7, 3),
-- (1, 4),
-- (2, 4),
-- (3, 4),
-- (4, 4),
-- (5, 2),
-- (7, 2),
-- (5, 1),
-- (5, 1);


-- -- Insert sample comments


-- INSERT INTO comments (user_id, post_id, content) VALUES

-- (1, 1, 'Great insights on mobile security!'),

-- (2, 2, 'This visualization guide is very helpful.'),

-- (3, 3, 'Docker optimization tips are spot on.'),

-- (4, 4, 'Ethical hacking is an essential skill.'),

-- (5, 5, 'Neural networks explained clearly.'),

-- (6, 6, 'API design patterns are well covered.'),

-- (7, 7, 'Unreal Engine tips are very practical.'),

-- (8, 8, 'Serverless architecture is the future.'),

-- (9, 9, 'Smart contract security is crucial.'),

-- (10, 10, 'Advanced TypeScript types are fascinating.');


-- COMMIT;
