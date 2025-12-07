# Context: Catat Buku RBR

## Project Overview
Catat Buku RBR is a simplified book recording application designed for visitors to quickly scan and record books they have read on a given day. The app focuses on simplicity and ease of use.

## Core Requirements

### Functionality
1. **ISBN Scanning**: Use device camera to scan ISBN barcodes from books
2. **Google Books API Integration**: Automatically fetch book details (title, author, cover, etc.) using the scanned ISBN
3. **Daily Recording**: Save books that visitors have read on the current day
4. **No Authentication**: No login system - completely open for any visitor
5. **Date-based Organization**: Books are organized and displayed by the date they were recorded

### Technical Stack
- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn-ui + Tailwind CSS
- **Backend API**: Vercel Serverless Functions
- **Database**: MongoDB
- **ISBN Scanning**: Quagga2 library for barcode scanning
- **Book Data**: Google Books API

### Data Model
Each book record contains:
- ISBN (from scan)
- Title (from Google Books API)
- Author (from Google Books API)
- Cover URL (from Google Books API)
- Year, Publisher, Genre, Description (optional, from Google Books API)
- **date_recorded**: The date when the book was recorded (YYYY-MM-DD format)
- **created_at**: Timestamp of when the record was created

### Pages
1. **Capture/Record Page** (`/`): 
   - Camera-based ISBN scanner
   - Auto-fetch book details from Google Books API
   - Save button to record the book for today
   - Simple, focused interface

2. **Book List by Date** (`/list`):
   - Display books grouped by date_recorded
   - Show most recent dates first
   - Simple card layout with book covers and basic info

## Simplifications from Original
- Removed: User authentication/login system
- Removed: Book detail/edit pages
- Removed: Delete functionality
- Removed: Manual entry option (scan only)
- Simplified: Single purpose - record books read today
- Simplified: Date-based organization instead of user-based

## Environment Variables
- `VITE_GOOGLE_BOOKS_API_KEY`: Google Books API key (optional but recommended)
- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB_NAME`: Database name (default: `catat_buku_rbr`)
