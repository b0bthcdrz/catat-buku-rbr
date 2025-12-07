import { useEffect, useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Library as LibraryIcon, Plus, BookOpen, Edit, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Library() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);
  const navigate = useNavigate();
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
        setBooks(body?.books ?? []);
      } catch (error) {
        console.error(error);
        setBooks([]);
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

  const count = books.length;

  const handleDeleteBook = async (bookId: number, bookTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${bookTitle}"?`)) return;

    try {
      setDeletingBookId(bookId);
      
      const response = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message || "Failed to delete book");
      }

      // Remove from local state
      setBooks(books.filter(b => b.id !== bookId));
      
      toast({
        title: "Book deleted",
        description: `${bookTitle} has been removed from your library`,
      });
    } catch (err: any) {
      console.error("Error deleting book:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to delete book",
        variant: "destructive",
      });
    } finally {
      setDeletingBookId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <LibraryIcon className="h-8 w-8 text-book-spine" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Library</h1>
              <p className="text-muted-foreground">{loading ? "Loading..." : `${count} books in your collection`}</p>
            </div>
          </div>
          
          <Link to="/add">
            <Button className="bg-gradient-hero hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </Link>
        </div>

        {(!loading && books.length === 0) ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your library is empty</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Start building your digital book collection by scanning or entering ISBNs
              </p>
              <Link to="/add">
                <Button className="bg-gradient-hero hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Book
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {books.map((book) => (
            <Card
              key={book.id}
              className="group relative cursor-pointer hover:shadow-book transition-all duration-300 hover:-translate-y-1"
              onClick={() => navigate(`/book/${book.id}`)}
            >
              <CardContent className="p-4">
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/edit/${book.id}`);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBook(book.id, book.title);
                      }}
                      disabled={deletingBookId === book.id}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Book Cover */}
                <div 
                  className="relative w-full aspect-[2/3] rounded shadow-sm bg-muted mb-3 overflow-hidden"
                  onClick={() => navigate(`/book/${book.id}`)}
                >
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
                <div 
                  className="space-y-1"
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  <h3 className="font-medium text-sm leading-tight line-clamp-2">{book.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{book.author}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{book.year || "0000"}</span>
                    {book.isbn && (
                      <span className="text-xs bg-muted px-1 py-0.5 rounded">ISBN</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
      </main>
    </div>
  );
}