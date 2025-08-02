# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multilingual personal website built with Hugo using the PaperMod theme. The site supports both English (`/en`) and Chinese (`/zh`) content with language switching functionality.

## Development Commands

### Build and Development
- `hugo server` - Start development server with live reload
- `hugo server -D` - Start development server including draft content
- `hugo` - Build static site for production (outputs to `public/`)
- `hugo server --bind=0.0.0.0` - Start server accessible from external network

### Content Management
- `hugo new content/en/posts/post-name.md` - Create new English post
- `hugo new content/zh/posts/post-name.md` - Create new Chinese post
- `hugo new content/en/page-name.md` - Create new English page
- `hugo new content/zh/page-name.md` - Create new Chinese page

## Architecture

### Hugo Configuration
- **Main config**: `hugo.yaml` - Contains multilingual setup, theme configuration, and site parameters
- **Theme**: PaperMod (located in `themes/PaperMod/`)
- **Go modules**: Uses Hugo modules system with `go.mod` for theme management

### Content Structure
```
content/
├── en/           # English content
│   ├── posts/    # Blog posts
│   ├── CV.md     # Resume page
│   └── _index.md # Homepage content
└── zh/           # Chinese content
    ├── posts/    # Blog posts (Chinese)
    ├── CV.md     # Resume page (Chinese)
    └── _index.md # Homepage content (Chinese)
```

### Custom Modifications
- **Profile mode**: Custom profile page with TypeIt animations for subtitle (`layouts/partials/index_profile.html`)
- **Language switching**: Custom header with flag-based language toggle (`layouts/partials/header.html`)
- **Search shortcut**: Keyboard shortcut (Cmd/Ctrl+K) to jump to search (`assets/js/custom.js`)
- **Upvote system**: Custom upvote functionality with external API integration
- **Custom styling**: Profile image hover rotation animation (`assets/css/extended/custom.css`)

### Key Features
- **Multilingual**: Full English/Chinese support with language selector
- **Profile mode**: Animated typewriter effect for subtitle text
- **Custom upvote**: Post upvoting with external API (`upvoteURL` parameter)
- **Search**: Full-text search with keyboard shortcut support
- **Responsive**: Mobile-friendly design with dark/light theme toggle

### Important Files
- `hugo.yaml` - Main configuration with multilingual and theme settings
- `layouts/partials/header.html` - Custom header with language switching
- `layouts/partials/index_profile.html` - Profile page with TypeIt animation
- `assets/css/extended/custom.css` - Custom styling overrides
- `assets/js/custom.js` - Custom JavaScript functionality

### Theme Customization
The site extends PaperMod theme with custom partials in `layouts/partials/` that override the theme defaults. Key customizations include multilingual support, profile animations, and custom upvote functionality.

## Content Guidelines

### Multilingual Content
- Always create content in both English and Chinese when adding new pages
- Use consistent frontmatter structure across languages
- Maintain parallel directory structure in `content/en/` and `content/zh/`

### Posts
- Place posts in `content/{lang}/posts/` directories
- Use descriptive filenames that work for both languages
- Include proper frontmatter with title, date, and tags