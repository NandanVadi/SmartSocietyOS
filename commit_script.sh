#!/bin/bash
set -e

# Setup git repo
rm -rf .git
git init -b main

# Nandan: Initialize Project Structure
git config user.name "Nandan Vadi"
git config user.email "nandanvadi@gmail.com"
git add README.md .gitignore backend/package.json backend/package-lock.json backend/.env.example
git commit -m "Initialize project structure and base configurations"

# Nandan: Database Models & Config
git add backend/src/config/ backend/src/models/
git commit -m "Add database schemas, models, and configuration"

# Nandan: Backend Server Core & Middleware
git add backend/src/server.js backend/src/app.js backend/src/middleware/
git commit -m "Implement backend foundation and middleware"

# Nandan: Backend API Routes & Controllers
git add backend/src/routes/ backend/src/controllers/
git commit -m "Create APIs, controllers, and routing logic"

# Nandan: Backend Testing & Seed
git add backend/tests/ backend/src/seed.js
git commit -m "Add backend tests and database seeding scripts"

# Darsh: Frontend Initialization
git config user.name "Darsh Parekh"
git config user.email "parekhdarsh002@gmail.com"
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/.gitignore frontend/.env.example frontend/.oxlintrc.json frontend/index.html
git commit -m "Initialize frontend structure and configurations"

# Darsh: Frontend Core Structure & Styling
git add frontend/src/main.jsx frontend/src/App.jsx frontend/src/index.css
git commit -m "Implement frontend entry points and global styling"

# Darsh: Frontend Context & Utilities
git add frontend/src/context/ frontend/src/utils/
git commit -m "Add frontend state management and utility functions"

# Darsh: Frontend Components
git add frontend/src/components/ frontend/public/
git commit -m "Build reusable UI components and assets"

# Darsh: Frontend Pages & Final Integration
git add frontend/src/pages/
git commit -m "Implement main pages and integrate frontend with backend"

# Add any remaining files just in case
git add .
if ! git diff-index --quiet HEAD; then
    git commit -m "Finalize project integration and cleanup"
fi

git remote add origin https://github.com/NandanVadi/SmartSocietyOS.git
git push -u origin main --force
