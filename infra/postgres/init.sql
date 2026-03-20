-- Inicialização do banco de dados de desenvolvimento
-- Executado automaticamente no primeiro start do container

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- busca fuzzy
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- normalização de strings PT-BR
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- índices para ranges de datas

-- Base de teste (para testes de integração)
CREATE DATABASE servicos_test;
GRANT ALL PRIVILEGES ON DATABASE servicos_test TO postgres;
