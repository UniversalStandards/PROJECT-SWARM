import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function PublicHeader() {
  const { isAuthenticated, isLoading } = useAuth();

  const navItems = [
    { href: "/features", label: "Features" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
  ];

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      window.location.href = "/app";
    } else {
      window.location.href = "/api/login";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 hover-elevate transition-all px-3 py-2 rounded-lg">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-blue-500">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h2 className="font-bold text-lg">SWARM</h2>
            <p className="text-xs text-muted-foreground">Workflow & Repo Manager</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {isLoading ? null : isAuthenticated ? (
            <Button onClick={() => window.location.href = "/app"} data-testid="button-dashboard">
              Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleLogin} data-testid="button-login">
                Log In
              </Button>
              <Button onClick={handleGetStarted} data-testid="button-get-started">
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-6 mt-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-blue-500">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">SWARM</h2>
                    <p className="text-xs text-muted-foreground">Workflow & Repo Manager</p>
                  </div>
                </div>
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-sm font-medium hover-elevate px-4 py-2 rounded-lg transition-all"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="flex flex-col gap-2 pt-4 border-t">
                  {isLoading ? null : isAuthenticated ? (
                    <Button onClick={() => window.location.href = "/app"} className="w-full">
                      Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={handleLogin} className="w-full">
                        Log In
                      </Button>
                      <Button onClick={handleGetStarted} className="w-full">
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
