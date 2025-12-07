import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  BookOpen, 
  Calendar, 
  Building, 
  Hash,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  cover_url: string | null;
  year: string | null;
  genre: string | null;
  description: string | null;
  publisher: string | null;
  created_at: string;
}

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchBook = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/books/${id}`);
        if (!response.ok) {
          throw new Error("Failed to load book details");
        }
        const body = await response.json();
        setBook(body?.book ?? null);
      } catch (err) {
        console.error("Error:", err);
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load book details",
          variant: "destructive",
        });
        navigate("/library");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id, navigate, toast]);

  const handleDelete = async () => {
    if (!book || !confirm("Are you sure you want to delete this book?")) return;

    try {
      setDeleting(true);
      
      const response = await fetch(`/api/books/${book.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message || "Failed to delete book");
      }

      toast({
        title: "Book deleted",
        description: `${book.title} has been removed from your library`,
      });
      
      navigate("/library");
    } catch (err: any) {
      console.error("Error deleting book:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to delete book",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading book details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Book not found</h1>
            <Link to="/library">
              <Button>Back to Library</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/library">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Button>
            </Link>
            <div className="flex-1" />
            <Link to={`/edit/${book.id}`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>

          {/* Book Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cover and Basic Info */}
            <div className="lg:col-span-1">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  {/* Cover Image */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-48 aspect-[2/3] rounded-lg shadow-lg overflow-hidden bg-muted">
                      {book.cover_url ? (
                        <img 
                          src={book.cover_url} 
                          alt={book.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDEyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNiA3Mkg4NFY4NEg3MlY5Nkg4NFYxMDhINzJWMTIwSDg0VjEzMkgzNlY3MloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground mb-2">{book.title}</h1>
                      <p className="text-lg text-muted-foreground">
                        by {book.author || "Unknown author"}
                      </p>
                    </div>

                    <Separator />

                    {/* Metadata */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Published:</span>
                        <span className="font-medium">
                          {book.year && book.year !== "0000" ? book.year : "Unknown"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Publisher:</span>
                        <span className="font-medium">
                          {book.publisher || "Not specified"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">ISBN:</span>
                        <span className="font-medium font-mono">
                          {book.isbn || "Not provided"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Genre:</span>
                        {book.genre ? (
                          <Badge variant="secondary">{book.genre}</Badge>
                        ) : (
                          <span className="font-medium text-muted-foreground/80">Not set</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <div className="lg:col-span-2">
              <Card className="shadow-card h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {book.description ? (
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {book.description}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No description available for this book.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
