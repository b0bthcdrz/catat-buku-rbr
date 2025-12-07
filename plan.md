# Implementation Plan: Catat Buku RBR Simplification

## Phase 1: Create GitHub Repository
1. Create new private repository on GitHub named `catat-buku-rbr`
2. Push existing codebase to the repository
3. Set up remote tracking

## Phase 2: Update Data Model
1. **Update MongoDB Schema** (`api/_lib/mongo.ts`):
   - Remove `user_id` field from `BookDocument` type
   - Add `date_recorded: string` field (YYYY-MM-DD format)
   - Update `serializeBook` to include `date_recorded`

2. **Update API Endpoints**:
   - `api/books.ts` (POST):
     - Remove `user_id` from insert document
     - Add `date_recorded: new Date().toISOString().split('T')[0]` (today's date)
   - `api/books.ts` (GET):
     - Update to group by `date_recorded` or add query param for date filtering
     - Sort by `date_recorded` descending, then `created_at` descending
   - `api/books/[id].ts`:
     - Keep GET for individual book (may be needed for list view)
     - Remove PUT/PATCH (no editing)
     - Remove DELETE (no deletion)

## Phase 3: Simplify Frontend Pages

1. **Create New Capture Page** (`src/pages/Capture.tsx`):
   - Integrate ISBNScanner component directly
   - Auto-fetch from Google Books API when ISBN detected
   - Show book preview (cover, title, author)
   - Simple "Record Book" button
   - Auto-save or manual save option
   - Success message and reset for next scan

2. **Update List Page** (`src/pages/List.tsx` - rename from Library.tsx):
   - Fetch all books from API
   - Group books by `date_recorded`
   - Display dates in descending order (most recent first)
   - Show date headers (e.g., "2025-01-15")
   - Display books in grid under each date
   - Simple card layout: cover, title, author
   - No edit/delete buttons

3. **Update App Routing** (`src/App.tsx`):
   - Remove routes: `/book/:id`, `/edit/:id`, `/add`, `/library`
   - Add routes: `/` (Capture page), `/list` (List page)
   - Remove unused imports

4. **Update Navigation** (`src/components/ui/navigation.tsx`):
   - Simplify to just two links: "Record" (/) and "View List" (/list)
   - Remove other navigation items

## Phase 4: Remove Unused Code
1. Delete files:
   - `src/pages/BookDetail.tsx`
   - `src/pages/EditBook.tsx`
   - `src/pages/Index.tsx` (landing page)
   - `src/pages/AddBook.tsx` (replaced by Capture.tsx)
   - `src/pages/Library.tsx` (replaced by List.tsx)

2. Clean up:
   - Remove unused imports from App.tsx
   - Remove unused components if any

## Phase 5: Update Documentation
1. Update `README.md`:
   - Reflect simplified app purpose
   - Update database schema documentation
   - Update environment variables section
   - Remove references to user authentication

## Implementation Order
1. ✅ Create context.md, plan.md, current_status.md (done)
2. Create GitHub repo and push code
3. Update MongoDB schema and API endpoints
4. Create new Capture page
5. Create new List page
6. Update routing and navigation
7. Delete unused pages
8. Test end-to-end flow
9. Update README

## Testing Checklist
- [ ] ISBN scan works and detects barcode
- [ ] Google Books API fetches book data correctly
- [ ] Book saves with today's date in `date_recorded`
- [ ] List page groups books by date correctly
- [ ] Most recent dates appear first
- [ ] No errors in console
- [ ] Mobile responsive design works
