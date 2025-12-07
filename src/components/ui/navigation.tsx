import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Book, Plus, Library } from "lucide-react";

export function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Book },
    { path: "/add", label: "Add Book", icon: Plus },
    { path: "/library", label: "Library", icon: Library },
  ];

  return (
    <nav className="flex items-center justify-between p-4 bg-card border-b border-border">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold text-book-spine">
        <Book className="h-6 w-6" />
        BookSnap
      </Link>
      
      <div className="hidden md:flex items-center gap-6">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              location.pathname === path
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* Mobile menu */}
      <div className="flex md:hidden items-center gap-4">
        {navItems.slice(1).map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors",
              location.pathname === path
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}