import { Link, useLocation } from 'react-router-dom';
import { Zap, Menu, X, Download, ArrowDownLeft, ArrowUpRight, Wallet, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWallet } from '@/contexts/WalletContext';
import { CheCkoInstallModal } from '@/components/wallet/CheCkoInstallModal';
import { DepositModal } from '@/components/wallet/DepositModal';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/matches', label: 'Matches' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/how-it-works', label: 'How It Works' },
];

export function Header() {
  const { wallet, connect, disconnect, isConnecting, isCheCkoAvailable, showInstallGuide, setShowInstallGuide, error } = useWallet();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnect = () => {
    if (!isCheCkoAvailable) {
      setShowInstallGuide(true);
    } else {
      connect();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Zap className="h-8 w-8 text-primary transition-all group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display text-xl font-bold tracking-wider">
              <span className="text-primary">LIVE</span>
              <span className="text-foreground">PREDICT</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'font-body text-sm font-semibold uppercase tracking-wide transition-colors',
                  location.pathname === link.href
                    ? 'text-primary text-glow-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Wallet & Mobile Menu */}
          <div className="flex items-center gap-4">
            {wallet.connected ? (
              <div className="hidden sm:flex items-center gap-2">
                {/* Balance with Deposit Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      <span className="font-body text-sm font-semibold text-primary">
                        {wallet.balance.available.toLocaleString()} LPT
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setShowDepositModal(true)} className="cursor-pointer">
                      <ArrowDownLeft className="mr-2 h-4 w-4 text-primary" />
                      <span>Deposit TLINERA</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/wallet">
                        <Wallet className="mr-2 h-4 w-4" />
                        <span>Wallet Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={disconnect} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Disconnect</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Address Badge */}
                <Link
                  to="/wallet"
                  className="px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors font-body text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  {formatAddress(wallet.address!)}
                </Link>
              </div>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="hidden sm:flex font-body font-bold uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
              >
                {isConnecting ? (
                  'Connecting...'
                ) : !isCheCkoAvailable ? (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Install CheCko
                  </>
                ) : (
                  'Connect CheCko'
                )}
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'font-body text-base font-semibold uppercase tracking-wide py-2 transition-colors',
                  location.pathname === link.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
            
            {wallet.connected ? (
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="font-body text-sm font-semibold text-primary">
                      {wallet.balance.available.toLocaleString()} LPT
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatAddress(wallet.address!)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setShowDepositModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="bg-primary text-primary-foreground"
                  >
                    <ArrowDownLeft className="mr-1 h-4 w-4" />
                    Deposit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/wallet">
                      <Wallet className="mr-1 h-4 w-4" />
                      Wallet
                    </Link>
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={disconnect} className="text-destructive hover:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="font-body font-bold uppercase"
                >
                  {isConnecting ? (
                    'Connecting...'
                  ) : !isCheCkoAvailable ? (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Install CheCko
                    </>
                  ) : (
                    'Connect CheCko'
                  )}
                </Button>
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Modals */}
      <CheCkoInstallModal open={showInstallGuide} onOpenChange={setShowInstallGuide} />
      <DepositModal open={showDepositModal} onOpenChange={setShowDepositModal} />
    </header>
  );
}
