-- SERVIX PostgreSQL Initialization
-- Extensions needed for the marketplace

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PostGIS for geospatial queries (install when needed)
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- For encrypted columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Set timezone
SET timezone = 'UTC';

-- Create read replica user (for load balancing)
-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'servix_reader') THEN
--     CREATE USER servix_reader WITH PASSWORD 'reader_password';
--     GRANT CONNECT ON DATABASE servix_dev TO servix_reader;
--     GRANT USAGE ON SCHEMA public TO servix_reader;
--     GRANT SELECT ON ALL TABLES IN SCHEMA public TO servix_reader;
--     ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO servix_reader;
--   END IF;
-- END $$;

SELECT 'SERVIX database initialized successfully' AS status;
