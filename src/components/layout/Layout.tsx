import { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background cyber-grid">
      <Header />
      <main className="pt-16">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border bg-background/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold">
                <span className="text-primary">LIVE</span>
                <span className="text-foreground">PREDICT</span>
              </span>
              <span className="text-muted-foreground text-sm">
                © 2024 Built on Linera
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Docs</a>
              <a 
                href="https://linera.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Powered by Linera
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
