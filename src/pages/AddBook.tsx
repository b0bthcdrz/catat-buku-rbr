
import { useEffect, useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpenCheck, BookPlus, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchBookByIsbn } from "@/lib/googleBooks";

type BookFormData = {
  title: string;
  authors: string;
  isbn: string;
  year: string;
  publisher: string;
  genre: string;
  description: string;
  cover_url: string;
};

const emptyBook: BookFormData = {
  title: "",
  authors: "",
  isbn: "",
  year: "",
  publisher: "",
  genre: "",
  description: "",
  cover_url: "",
};

export default function AddBook() {
  const [bookData, setBookData] = useState<BookFormData | null>(null);
  const [isbnInput, setIsbnInput] = useState("");
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

  const handleLookup = async () => {
    const cleanedIsbn = isbnInput.replace(/[^\dXx]/g, "");
    if (!cleanedIsbn) {
      toast({ title: "Enter an ISBN", description: "Please type a valid ISBN first.", variant: "destructive" });
      return;
    }

    try {
      setIsLookingUp(true);
      const data = await fetchBookByIsbn(cleanedIsbn);

      if (!data) {
        toast({
          title: "No book found",
          description: "Google Books could not find that ISBN. Try another one or enter details manually.",
          variant: "destructive",
        });
        return;
      }

      setBookData({
        title: data.title ?? "",
        authors: (data.authors ?? []).join(", "),
        isbn: cleanedIsbn,
        year: data.year ?? "",
        publisher: data.publisher ?? "",
        genre: data.genre ?? "",
        description: data.description ?? "",
        cover_url: data.coverUrl ?? "",
      });

      toast({
        title: "Book data found!",
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

  const startManualEntry = () => {
    setBookData({
      ...emptyBook,
      isbn: isbnInput.replace(/[^\dXx]/g, ""),
    });

    toast({
      title: "Manual entry",
      description: "Fill in the fields below and save when ready.",
    });
  };

  const updateField = (field: keyof BookFormData, value: string) => {
    setBookData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const saveBook = async () => {
    try {
      if (!bookData) {
        toast({ title: "Missing details", description: "Scan or enter details first.", variant: "destructive" });
        return;
      }

      if (!bookData.title || !bookData.authors) {
        toast({
          title: "Missing details",
          description: "Title and author are required before saving.",
          variant: "destructive",
        });
        return;
      }

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

      toast({ title: "Book saved!", description: `${bookData.title} added to your library.` });
      
      // Clear form for next book
      setBookData(null);
      setIsbnInput("");
    } catch (err: any) {
      console.error(err);
      toast({ title: "Save failed", description: err?.message ?? String(err), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Add New Book</h1>
            <p className="text-muted-foreground">
              Look up a title by ISBN, review the details, and save it to your shelf.
            </p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5" />
                ISBN Lookup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="isbn-input">ISBN</Label>
                <Input
                  id="isbn-input"
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                  placeholder="e.g. 9780143127741"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 bg-gradient-hero hover:opacity-90"
                  onClick={handleLookup}
                  disabled={isLookingUp}
                >
                  {isLookingUp ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isLookingUp ? "Searching..." : "Lookup ISBN"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={startManualEntry}
                >
                  <BookPlus className="h-4 w-4 mr-2" />
                  Manual Entry
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: You can paste either ISBN-10 or ISBN-13. We’ll fetch details from Google Books automatically.
              </p>
            </CardContent>
          </Card>

          {bookData && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Review &amp; Edit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-24 h-36 rounded bg-muted overflow-hidden shadow-sm">
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
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={bookData.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        placeholder="Book title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="authors">Authors *</Label>
                      <Input
                        id="authors"
                        value={bookData.authors}
                        onChange={(e) => updateField("authors", e.target.value)}
                        placeholder="Separate multiple authors with commas"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={bookData.isbn}
                      onChange={(e) => updateField("isbn", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Publication Year</Label>
                    <Input
                      id="year"
                      value={bookData.year}
                      maxLength={4}
                      onChange={(e) => updateField("year", e.target.value)}
                      placeholder="YYYY"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input
                      id="publisher"
                      value={bookData.publisher}
                      onChange={(e) => updateField("publisher", e.target.value)}
                      placeholder="Publisher name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="genre">Genre</Label>
                    <Input
                      id="genre"
                      value={bookData.genre}
                      onChange={(e) => updateField("genre", e.target.value)}
                      placeholder="e.g. Fantasy, Biography"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cover-url">Cover Image URL</Label>
                  <Input
                    id="cover-url"
                    value={bookData.cover_url}
                    onChange={(e) => updateField("cover_url", e.target.value)}
                    placeholder="https://"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={bookData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Optional summary or notes"
                    rows={6}
                  />
                </div>

                <Button onClick={saveBook} className="w-full bg-gradient-hero hover:opacity-90">
                  Save to Library
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
