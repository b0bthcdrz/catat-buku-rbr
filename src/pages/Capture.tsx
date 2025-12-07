import { useState, useEffect } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenCheck, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchBookByIsbn } from "@/lib/googleBooks";
import ISBNScanner from "@/components/ISBNScanner";

type BookData = {
  title: string;
  authors: string;
  isbn: string;
  year: string;
  publisher: string;
  genre: string;
  description: string;
  cover_url: string;
};

export default function Capture() {
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_BOOKS_API_KEY) {
      toast({
        title: "Google Books API Key",
        description: "No VITE_GOOGLE_BOOKS_API_KEY found. Public requests will work but are rate limited.",
      });
    }
  }, [toast]);

  const handleISBNDetected = async (isbn: string) => {
    try {
      setIsLookingUp(true);
      const data = await fetchBookByIsbn(isbn);

      if (!data) {
        toast({
          title: "No book found",
          description: "Google Books could not find that ISBN. Please try scanning again.",
          variant: "destructive",
        });
        return;
      }

      setBookData({
        title: data.title ?? "",
        authors: (data.authors ?? []).join(", "),
        isbn: isbn,
        year: data.year ?? "",
        publisher: data.publisher ?? "",
        genre: data.genre ?? "",
        description: data.description ?? "",
        cover_url: data.coverUrl ?? "",
      });

      toast({
        title: "Book found!",
        description: `${data.title} by ${(data.authors ?? []).join(", ")}`,
      });
    } catch (error: any) {
      console.error("ISBN lookup failed:", error);
      toast({
        title: "Lookup failed",
        description: error?.message || "Could not fetch book data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const saveBook = async () => {
    if (!bookData) {
      toast({ title: "No book data", description: "Scan an ISBN first.", variant: "destructive" });
      return;
    }

    if (!bookData.title || !bookData.authors) {
      toast({
        title: "Missing details",
        description: "Title and author are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookData),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message || "Failed to save book");
      }

      toast({ 
        title: "Book recorded!", 
        description: `${bookData.title} has been recorded for today.` 
      });
      
      // Reset for next scan
      setBookData(null);
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Save failed", 
        description: err?.message ?? String(err), 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Record Book</h1>
            <p className="text-muted-foreground">
              Scan the ISBN barcode to record a book you've read today.
            </p>
          </div>

          <ISBNScanner 
            onISBNDetected={handleISBNDetected}
            className="w-full"
          />

          {isLookingUp && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                <span>Looking up book details...</span>
              </CardContent>
            </Card>
          )}

          {bookData && !isLookingUp && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpenCheck className="h-5 w-5" />
                  Book Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-24 h-36 rounded bg-muted overflow-hidden shadow-sm flex-shrink-0">
                    {bookData.cover_url ? (
                      <img
                        src={bookData.cover_url}
                        alt={bookData.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iMTEyIiB2aWV3Qm94PSIwIDAgODAgMTEyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iMTEyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCA0OEg1NlY1Nkg0OFY2NEg1NlY3Mkg0OFY4MEg1NlY4OEgyNFY0OFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground px-2 text-center">
                        No cover
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-lg">{bookData.title}</h3>
                      <p className="text-muted-foreground">{bookData.authors}</p>
                    </div>
                    {bookData.year && (
                      <p className="text-sm text-muted-foreground">Published: {bookData.year}</p>
                    )}
                    {bookData.publisher && (
                      <p className="text-sm text-muted-foreground">Publisher: {bookData.publisher}</p>
                    )}
                    {bookData.genre && (
                      <p className="text-sm text-muted-foreground">Genre: {bookData.genre}</p>
                    )}
                  </div>
                </div>

                {bookData.description && (
                  <div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {bookData.description}
                    </p>
                  </div>
                )}

                <Button 
                  onClick={saveBook} 
                  className="w-full bg-gradient-hero hover:opacity-90"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Record This Book
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
