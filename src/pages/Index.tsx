import { Navigation } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Search, Library, BookOpen, Scan, Smartphone, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <BookOpen className="h-16 w-16 mx-auto text-book-spine mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Your Digital
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                Book Library
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Scan ISBN barcodes or enter them manually to instantly add books to your personal digital library. 
              Track your reading collection with beautiful book covers and metadata.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/add">
              <Button size="lg" className="bg-gradient-hero hover:opacity-90 text-lg px-8 py-6">
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Book
              </Button>
            </Link>
            <Link to="/library">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <Library className="h-5 w-5 mr-2" />
                View Library
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How BookSnap Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-card hover:shadow-book transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-hero rounded-full flex items-center justify-center">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Scan ISBN Barcode</h3>
                <p className="text-muted-foreground">
                  Use your camera to scan any book's ISBN barcode for instant recognition
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-book transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-hero rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Auto-Fill Details</h3>
                <p className="text-muted-foreground">
                  Book title, author, cover image, and publication details are fetched automatically
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-book transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-hero rounded-full flex items-center justify-center">
                  <Library className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Build Your Library</h3>
                <p className="text-muted-foreground">
                  Save books to your personal digital library with beautiful cover art
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="max-w-4xl mx-auto shadow-book bg-gradient-card">
          <CardContent className="p-12 text-center">
            <Smartphone className="h-12 w-12 mx-auto text-book-spine mb-6" />
            <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Add your first book to begin building your digital library
            </p>
            <Link to="/add">
              <Button size="lg" className="bg-gradient-hero hover:opacity-90 text-lg px-8">
                <Scan className="h-5 w-5 mr-2" />
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Index;
