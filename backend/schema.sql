-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    AvatarURL TEXT UNIQUE DEFAULT '',
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
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
    ImageURL TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    trending_score INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Comments Table (with nested comment support)
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    parent_id INTEGER DEFAULT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
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

-- Indexes for likes and comments for performance improvement
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

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

-- -- Insert sample posts
-- -- Categories with diverse topics
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

-- -- Users with varied backgrounds
-- INSERT INTO users (username, email, password_hash) VALUES
-- ('john_dev', 'john@dev.com', '$2a$10$hashedpass1'),
-- ('jane_tech', 'jane@tech.com', '$2a$10$hashedpass2'),
-- ('alice_data', 'alice@data.com', '$2a$10$hashedpass3'),
-- ('bob_security', 'bob@security.com', '$2a$10$hashedpass4'),
-- ('emma_cloud', 'emma@cloud.com', '$2a$10$hashedpass5'),
-- ('mike_game', 'mike@game.com', '$2a$10$hashedpass6'),
-- ('sarah_ai', 'sarah@ai.com', '$2a$10$hashedpass7'),
-- ('james_arch', 'james@arch.com', '$2a$10$hashedpass8'),
-- ('lisa_mobile', 'lisa@mobile.com', '$2a$10$hashedpass9'),
-- ('david_block', 'david@block.com', '$2a$10$hashedpass10');

-- -- Posts with varying trending scores
-- INSERT INTO posts (user_id, category_id, title, content, ImageURL, trending_score) VALUES
-- -- Trending Posts (High Scores)
-- (1, 1, 'Advanced React Patterns', 'Deep dive into React patterns...', 'https://example.com/react.jpg', 500),
-- (2, 5, 'Zero-Day Exploit Prevention', 'Latest security measures...', 'https://example.com/security.jpg', 450),
-- (3, 3, 'AI in Data Analysis', 'Machine learning applications...', 'https://example.com/ai-data.jpg', 400),
-- (4, 4, 'Kubernetes Best Practices', 'Container orchestration guide...', 'https://example.com/kube.jpg', 380),
-- (5, 9, 'AWS vs Azure vs GCP', 'Cloud platform comparison...', 'https://example.com/cloud.jpg', 350),

-- -- Moderately Trending Posts
-- (6, 8, 'Unity 3D Game Development', 'Creating immersive games...', 'https://example.com/unity.jpg', 280),
-- (7, 6, 'ChatGPT Integration Guide', 'Building AI-powered apps...', 'https://example.com/chatgpt.jpg', 260),
-- (8, 7, 'Microservices Architecture', 'Scaling distributed systems...', 'https://example.com/micro.jpg', 240),
-- (9, 2, 'Flutter vs React Native', 'Mobile framework comparison...', 'https://example.com/mobile.jpg', 220),
-- (10, 10, 'Web3 Development', 'Blockchain application guide...', 'https://example.com/web3.jpg', 200),

-- -- Regular Posts
-- (1, 2, 'iOS App Security', 'Mobile security guidelines...', 'https://example.com/ios.jpg', 150),
-- (2, 3, 'Python Data Visualization', 'Using matplotlib and seaborn...', 'https://example.com/python.jpg', 140),
-- (3, 4, 'Docker Optimization', 'Container performance tips...', 'https://example.com/docker.jpg', 130),
-- (4, 5, 'Ethical Hacking Guide', 'Penetration testing basics...', 'https://example.com/hacking.jpg', 120),
-- (5, 6, 'Neural Networks Explained', 'Deep learning fundamentals...', 'https://example.com/neural.jpg', 110),
-- (6, 7, 'API Design Patterns', 'REST and GraphQL best practices...', 'https://example.com/api.jpg', 100),
-- (7, 8, 'Unreal Engine Tips', 'Game optimization techniques...', 'https://example.com/unreal.jpg', 90),
-- (8, 9, 'Serverless Architecture', 'Building scalable functions...', 'https://example.com/serverless.jpg', 80),
-- (9, 10, 'Smart Contract Security', 'Blockchain security patterns...', 'https://example.com/smart.jpg', 70),
-- (10, 1, 'TypeScript Advanced Types', 'Type system deep dive...', 'https://example.com/typescript.jpg', 60);

--  COMMIT;