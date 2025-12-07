# Current Status: Catat Buku RBR

## Current Implementation

### What Exists
1. **Full-featured book library app** with:
   - User-based book storage (uses `user_id` field)
   - Multiple pages: Index, AddBook, Library, BookDetail, EditBook
   - ISBN scanning component (ISBNScanner.tsx)
   - Google Books API integration
   - MongoDB backend with proper serialization
   - Edit and delete functionality

2. **Current Pages**:
   - `/` - Landing page with features overview
   - `/add` - Add book page with ISBN lookup and manual entry
   - `/library` - Library view with all books in grid
   - `/book/:id` - Book detail page
   - `/edit/:id` - Edit book page

3. **Current Data Model**:
   ```typescript
   {
     user_id: string,  // DEMO_USER_ID constant
     title: string,
     author: string,
     isbn: string | null,
     cover_url: string | null,
     year: string,
     publisher: string | null,
     genre: string | null,
     description: string | null,
     created_at: string (ISO timestamp)
   }
   ```

### What Needs to Change

1. **Remove**:
   - User authentication concept (user_id field)
   - BookDetail page
   - EditBook page
   - Delete functionality
   - Manual entry option
   - Landing page (Index.tsx)

2. **Simplify**:
   - AddBook page → becomes the main capture/record page
   - Library page → becomes date-grouped list page
   - Remove edit/delete buttons from UI

3. **Add**:
   - `date_recorded` field (YYYY-MM-DD format)
   - Date-based grouping in list view
   - Auto-save on successful scan (or simple save button)

4. **Update**:
   - MongoDB schema to remove `user_id`, add `date_recorded`
   - API endpoints to work without user_id
   - Routing to only 2 pages: `/` (capture) and `/list` (view by date)

## Technical Debt / Issues
- Currently uses hardcoded `DEMO_USER_ID` - needs to be removed
- No date-based filtering/grouping exists
- Complex navigation with multiple pages - needs simplification
