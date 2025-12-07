# Catat Buku RBR

A book cataloging application built with React, TypeScript, and MongoDB.

## Project info

This is a book management application that allows you to:
- Add books by scanning ISBN or cover
- View and manage your book library
- Edit book details
- Search and organize your collection

## How can I edit this code?

**Use your preferred IDE**

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd catat-buku-rbr

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- MongoDB

## Environment variables

Create a `.env` (or `.env.local`) in the project root before running the dev server:

```bash
VITE_GOOGLE_BOOKS_API_KEY=your_google_books_api_key
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=catat_buku_rbr
```

- `VITE_GOOGLE_BOOKS_API_KEY` powers the ISBN lookup flow (Google Books API).  
  Without a key the lookup still works, but Google enforces a tiny anonymous quota.
- `MONGODB_URI` should point to the cluster you provisioned via the MCP MongoDB server (or Atlas/local).  
  A typical value looks like `mongodb+srv://<user>:<password>@cluster.example.mongodb.net`.
- `MONGODB_DB_NAME` defaults to `catat_buku_rbr`; override it if you created a different database name.

### MongoDB setup

The API stores books in the `books` collection inside the configured database.  
Each document looks like:

```jsonc
{
  "_id": ObjectId,
  "user_id": "00000000-0000-0000-0000-000000000001",
  "title": "Book title",
  "author": "Author Name",
  "isbn": "978...",
  "cover_url": "https://...",
  "year": "2024",
  "publisher": "Publisher",
  "genre": "Fantasy",
  "description": "Optional summary",
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

Create the `catat_buku_rbr` database and an empty `books` collection in your MongoDB cluster (e.g., via the MCP server or Compass). The Vercel API routes will automatically handle inserts/updates/deletes once the collection exists.

## How can I deploy this project?

This project can be deployed to Vercel or any other platform that supports Vite applications.
