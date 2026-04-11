# Joelmo's Blog

Personal blog built with Node.js + Express, with Markdown content stored on GitHub.

## Overview

The project serves static front-end pages and fetches posts in real time from a GitHub repository through the GitHub API.

- Home page with paginated post listing
- Post page with Markdown rendering
- Admin dashboard protected by JWT (httpOnly cookie)
- RSS generation at /feed.xml


## Structure

- app.js: HTTP server and main routes
- modules/Auth.js: authentication middleware
- modules/rssGen.js: RSS feed generator
- public/: pages, scripts, and styles
- posts/: post .md files

## Prerequisites

- Node.js 18+
- npm
- GitHub repository containing posts

## Installation

1. Clone the project
2. Install dependencies:

```bash
npm install
```

3. Create a .env file at the project root using the variables below
4. Start the server:

```bash
node app.js
```

Default server URL: http://localhost:3000

## Environment variables

Create a .env file with:

```env
PORT=3000

USERNAME=admin
PASSWORD=strong-password

JWT_SECRET=algo
SESSION_SECRET=algo

G_USERNAME=your-github-username
G_REPONAME=your-repo

# Optional (RSS)
BLOG_URL=http://localhost:3000

# Optional (if you use post create/update via GitHub API)
G_TOKEN=your-personal-token
```

## Post format

Posts should be stored in posts/ and follow this filename pattern:

DDMMMYYYYHHMM.md

Example:

27MAR20261219.md

Expected content format:

```md
TITLE: My post
DESCRIPTION: Short post summary
CATEGORY: Dev
IMAGE_URL: https://...
CONTENT:
# Title

Markdown content goes here.
```

## Deploy

This project is ready to be deployed to Vercel.

The .vercelignore file excludes the posts folder from build/deploy:

```gitignore
posts/**
```

## Notes

- Current login is based on username/password from .env
- This project will be divided into two phases: 
  - one where you explore the basic blog, its functionality, etc., 
  - second phase where the admin can create posts through the dashboard and not necessarily only manually via GitHub.