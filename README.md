# Catat Buku RBR

A simple book recording application for visitors to scan and record books they've read on a given day.

## Overview

Catat Buku RBR is a streamlined application that allows visitors to:
- **Scan ISBN barcodes** using their device camera
- **Automatically fetch book details** from Google Books API
- **Record books** they've read today
- **View books organized by date** they were recorded

No login required - completely open for any visitor to use.

## Features

- 📷 **Camera-based ISBN scanning** using Quagga2 barcode scanner
- 🔍 **Automatic book lookup** via Google Books API
- 📅 **Date-based organization** - books grouped by recording date
- 🎨 **Simple, clean UI** built with shadcn-ui and Tailwind CSS
- 📱 **Mobile responsive** design

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn-ui + Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: MongoDB
- **ISBN Scanning**: Quagga2
- **Book Data**: Google Books API

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd catat-buku-rbr

# Step 3: Install dependencies
npm install

# Step 4: Set up environment variables (see below)

# Step 5: Start the development server
npm run dev
```

## Environment Variables

Create a `.env` (or `.env.local`) file in the project root:

```bash
VITE_GOOGLE_BOOKS_API_KEY=your_google_books_api_key
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=catat_buku_rbr
```

- `VITE_GOOGLE_BOOKS_API_KEY`: Google Books API key (optional but recommended).  
  Without a key, the lookup still works but Google enforces a tiny anonymous quota.
- `MONGODB_URI`: MongoDB connection string.  
  Example: `mongodb+srv://<user>:<password>@cluster.example.mongodb.net`
- `MONGODB_DB_NAME`: Database name (defaults to `catat_buku_rbr`)

## MongoDB Setup

The API stores books in the `books` collection inside the configured database.

### Database Schema

Each book document:

```jsonc
{
  "_id": ObjectId,
  "title": "Book title",
  "author": "Author Name",
  "isbn": "978...",
  "cover_url": "https://...",
  "year": "2024",
  "publisher": "Publisher",
  "genre": "Fantasy",
  "description": "Optional summary",
  "date_recorded": "2025-01-15",  // YYYY-MM-DD format
  "created_at": "2025-01-15T10:30:00.000Z"
}
```

### Setup Steps

1. Create the `catat_buku_rbr` database in your MongoDB cluster
2. Create an empty `books` collection
3. The Vercel API routes will automatically handle inserts once the collection exists

## Pages

- **`/`** - Record page: Scan ISBN, view book details, record book for today
- **`/list`** - List page: View all recorded books grouped by date (most recent first)

## Development

```sh
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Deployment

This project can be deployed to Vercel or any platform that supports Vite applications.

For Vercel:
1. Connect your repository
2. Set environment variables in Vercel dashboard
3. Deploy

## License

MIT
