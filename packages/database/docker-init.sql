-- Docker PostgreSQL initialization
-- Creates schemas that Prisma needs
-- Extensions will be created by Prisma migrations
-- Tables will be created by Prisma migrations

-- Create schemas that Prisma expects
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS business;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS files;
CREATE SCHEMA IF NOT EXISTS i18n;
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS marketplace;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS security;
CREATE SCHEMA IF NOT EXISTS support;
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS voucher;

-- Note: public schema already exists by default
-- Note: Extensions will be created by Prisma migrations using CREATE EXTENSION IF NOT EXISTS