import { useEffect, useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Library as LibraryIcon, BookOpen, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  cover_url: string | null;
  year: string | null;
  date_recorded: string;
  created_at: string;
};

type BooksByDate = {
  [date: string]: Book[];
};

export default function List() {
  const [booksByDate, setBooksByDate] = useState<BooksByDate>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/books");
        if (!response.ok) {
          throw new Error("Failed to load books");
        }
        const body = await response.json();
        const books: Book[] = body?.books ?? [];
        
        // Group books by date_recorded
        const grouped: BooksByDate = {};
        books.forEach((book) => {
          const date = book.date_recorded || book.created_at.split('T')[0];
          if (!grouped[date]) {
            grouped[date] = [];
          }
          grouped[date].push(book);
        });
        
        setBooksByDate(grouped);
      } catch (error) {
        console.error(error);
        setBooksByDate({});
        toast({
          title: "Error loading books",
          description: error instanceof Error ? error.message : "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(booksByDate).sort((a, b) => b.localeCompare(a));
  const totalBooks = Object.values(booksByDate).reduce((sum, books) => sum + books.length, 0);

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <LibraryIcon className="h-8 w-8 text-book-spine" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Books by Date</h1>
            <p className="text-muted-foreground">
              {loading ? "Loading..." : `${totalBooks} book${totalBooks !== 1 ? 's' : ''} recorded`}
            </p>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <p className="text-muted-foreground">Loading books...</p>
            </CardContent>
          </Card>
        ) : sortedDates.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No books recorded yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Start recording books by scanning their ISBN barcodes
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-semibold text-foreground">
                    {formatDate(date)}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    ({booksByDate[date].length} book{booksByDate[date].length !== 1 ? 's' : ''})
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {booksByDate[date].map((book) => (
                    <Card
                      key={book.id}
                      className="group relative hover:shadow-book transition-all duration-300 hover:-translate-y-1"
                    >
                      <CardContent className="p-4">
                        {/* Book Cover */}
                        <div className="relative w-full aspect-[2/3] rounded shadow-sm bg-muted mb-3 overflow-hidden">
                          {book.cover_url ? (
                            <img 
                              src={book.cover_url} 
                              alt={book.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDEyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNiA3Mkg4NFY4NEg3MlY5Nkg4NFYxMDhINzJWMTIwSDg0VjEzMkgzNlY3MloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+";
                              }}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        {/* Book Info */}
                        <div className="space-y-1">
                          <h3 className="font-medium text-sm leading-tight line-clamp-2">{book.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{book.author}</p>
                          {book.year && (
                            <p className="text-xs text-muted-foreground">{book.year}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
