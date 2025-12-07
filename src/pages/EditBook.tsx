import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
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

const GENRES = [
  "Fiction",
  "Non-Fiction",
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Thriller",
  "Romance",
  "Historical Fiction",
  "Biography",
  "Autobiography",
  "Memoir",
  "Self-Help",
  "Business",
  "Technology",
  "Science",
  "History",
  "Philosophy",
  "Religion",
  "Poetry",
  "Drama",
  "Children's",
  "Young Adult",
  "Cookbook",
  "Travel",
  "Art",
  "Music",
  "Sports",
  "Education",
  "Reference",
  "Other"
];

export default function EditBook() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    year: "",
    publisher: "",
    genre: "",
    description: ""
  });

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
        const data = body?.book;
        setBook(data);
        setFormData({
          title: data?.title || "",
          author: data?.author || "",
          isbn: data?.isbn || "",
          year: data?.year || "",
          publisher: data?.publisher || "",
          genre: data?.genre || "",
          description: data?.description || ""
        });
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

  const handleSave = async () => {
    if (!book) return;

    try {
      setSaving(true);
      
      const response = await fetch(`/api/books/${book.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          authors: formData.author,
          isbn: formData.isbn,
          year: formData.year,
          publisher: formData.publisher,
          genre: formData.genre,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message || "Failed to update book");
      }

      toast({
        title: "Book updated",
        description: `${formData.title} has been updated successfully`,
      });
      
      navigate(`/book/${book.id}`);
    } catch (err: any) {
      console.error("Error updating book:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to update book",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
            <Button onClick={() => navigate("/library")}>Back to Library</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/book/${book.id}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Book
            </Button>
            <div className="flex-1" />
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-hero hover:opacity-90"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="space-y-6">
            {/* Cover Preview */}
            {book.cover_url && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Cover Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <div className="relative w-32 aspect-[2/3] rounded-lg shadow-md overflow-hidden bg-muted">
                      <img 
                        src={book.cover_url} 
                        alt={book.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDEyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNiA3Mkg4NFY4NEg3MlY5Nkg4NFYxMDhINzJWMTIwSDg0VjEzMkgzNlY3MloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+";
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Cover image cannot be edited here
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Book Details Form */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Edit Book Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Book title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Author name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                      placeholder="ISBN number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Publication Year</Label>
                    <Input
                      id="year"
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="YYYY"
                      maxLength={4}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    value={formData.publisher}
                    onChange={(e) => setFormData(prev => ({ ...prev, publisher: e.target.value }))}
                    placeholder="Publisher name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Select
                    value={formData.genre}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Book description..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}


