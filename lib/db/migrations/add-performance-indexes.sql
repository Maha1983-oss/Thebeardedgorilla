-- Add indexes for performance optimization
-- Migration: add-performance-indexes
-- Created: 2024-10-15

-- Index on users.email for faster login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on users.role for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index on users.createdAt for faster date-based queries (dashboard)
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Index on csvUploads.fileType for faster file type queries
CREATE INDEX IF NOT EXISTS idx_csv_uploads_file_type ON csv_uploads(file_type);

-- Index on csvUploads.isActive for faster active file queries
CREATE INDEX IF NOT EXISTS idx_csv_uploads_is_active ON csv_uploads(is_active);

-- Composite index on csvUploads for common query pattern
CREATE INDEX IF NOT EXISTS idx_csv_uploads_file_type_active ON csv_uploads(file_type, is_active);

-- Index on roles.name for faster role name lookups
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Add comments for documentation
COMMENT ON INDEX idx_users_email IS 'Speeds up login and email lookup queries';
COMMENT ON INDEX idx_users_role IS 'Speeds up role-based filtering and dashboard statistics';
COMMENT ON INDEX idx_users_created_at IS 'Speeds up user growth chart queries';
COMMENT ON INDEX idx_csv_uploads_file_type IS 'Speeds up CSV data retrieval by type';
COMMENT ON INDEX idx_csv_uploads_is_active IS 'Speeds up active CSV data queries';
COMMENT ON INDEX idx_csv_uploads_file_type_active IS 'Optimizes most common CSV query pattern';
COMMENT ON INDEX idx_roles_name IS 'Speeds up role name lookups';

