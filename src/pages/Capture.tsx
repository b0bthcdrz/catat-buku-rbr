import { useState, useEffect } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpenCheck, Loader2, Save, Barcode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchBookByIsbn } from "@/lib/googleBooks";
import ISBNScanner from "@/components/ISBNScanner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [isScanning, setIsScanning] = useState(false);
  const [pendingIsbn, setPendingIsbn] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_BOOKS_API_KEY) {
      toast({
        title: "Google Books API Key",
        description: "No VITE_GOOGLE_BOOKS_API_KEY found. Public requests will work but are rate limited.",
      });
    }
  }, [toast]);

  const handleISBNDetected = (isbn: string) => {
    // Pause scanning and ask user to confirm ISBN before lookup
    setIsScanning(false);
    setBookData(null);
    setPendingIsbn(isbn);
  };

  const confirmLookup = async () => {
    if (!pendingIsbn) return;
    try {
      setIsLookingUp(true);
      const data = await fetchBookByIsbn(pendingIsbn);

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
        isbn: pendingIsbn,
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

  const updateField = (field: keyof BookData, value: string) => {
    setBookData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-4 space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Record Book</h1>
            <p className="text-muted-foreground">
              Tap the button below to open the camera and scan an ISBN barcode.
            </p>
            {!isScanning && (
              <Button
                className="mt-2 bg-gradient-hero hover:opacity-90"
                size="lg"
                onClick={() => {
                  setBookData(null);
                setPendingIsbn(null);
                  setIsScanning(true);
                }}
              >
                <Barcode className="h-4 w-4 mr-2" />
                Record a new book
              </Button>
            )}
          </div>

          {isScanning && (
            <ISBNScanner
              isActive={isScanning}
              onISBNDetected={handleISBNDetected}
              onCancel={() => setIsScanning(false)}
              className="w-full"
            />
          )}

          {pendingIsbn && !isLookingUp && !bookData && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm ISBN</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Detected ISBN: <span className="font-semibold">{pendingIsbn}</span></p>
                <div className="flex gap-3">
                  <Button className="flex-1 bg-gradient-hero hover:opacity-90" onClick={confirmLookup}>
                    Lookup this ISBN
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                      setPendingIsbn(null);
                      setBookData(null);
                      setIsScanning(true);
                    }}
                  >
                    Rescan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                  Confirm &amp; Save
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
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={bookData.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder="Book title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authors">Author(s)</Label>
                      <Input
                        id="authors"
                        value={bookData.authors}
                        onChange={(e) => updateField("authors", e.target.value)}
                        placeholder="Author names"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">ISBN: {bookData.isbn}</p>
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
                      Save Book
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
