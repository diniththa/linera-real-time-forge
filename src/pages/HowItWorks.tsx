import { Link } from 'react-router-dom';
import { 
  Wallet, 
  Search, 
  MousePointer, 
  Zap, 
  ArrowRight,
  CheckCircle,
  Shield,
  Clock,
  Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';

export default function HowItWorks() {
  const { wallet, connect, isConnecting } = useWallet();

  const steps = [
    {
      icon: Wallet,
      title: 'Connect Your Wallet',
      description: 'Connect your CheCko or Croissant wallet to get started. New users receive 1000 testnet LPT tokens to begin predicting.',
      color: 'primary',
    },
    {
      icon: Search,
      title: 'Find a Live Match',
      description: 'Browse live CS2 and Valorant matches. Each match has multiple micro-markets for different in-game events.',
      color: 'secondary',
    },
    {
      icon: MousePointer,
      title: 'Make Your Prediction',
      description: 'Choose your prediction before the timer runs out. Odds update in real-time based on the betting pool.',
      color: 'accent',
    },
    {
      icon: Zap,
      title: 'Instant Settlement',
      description: 'When the event resolves, your bet is settled instantly on Linera. Winnings are credited to your balance immediately.',
      color: 'success',
    },
  ];

  const predictionTypes = [
    { title: 'Round Winner', description: 'Predict which team wins the current round', example: 'NAVI to win Round 15' },
    { title: 'First Blood', description: 'Which team gets the first kill in a round', example: 'FaZe First Blood' },
    { title: 'Bomb Plant', description: 'Will the bomb be planted this round?', example: 'Bomb Plant: Yes @ 1.65x' },
    { title: 'Clutch Outcome', description: 'Predict the outcome of a clutch situation', example: 's1mple to win 1v2 clutch' },
    { title: 'Total Kills', description: 'Over/under on total kills in a round', example: 'Over 6.5 kills @ 1.75x' },
    { title: 'Map Winner', description: 'Who wins the current map', example: 'G2 to win Inferno' },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            How <span className="text-primary">LivePredict</span> Works
          </h1>
          <p className="text-lg text-muted-foreground">
            Make real-time predictions on live esports plays and win instantly.
            Powered by Linera's sub-second finality.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div 
                key={step.title}
                className="flex gap-6 items-start"
              >
                {/* Step number and line */}
                <div className="flex flex-col items-center">
                  <div className={`h-14 w-14 rounded-xl bg-${step.color}/10 border border-${step.color}/30 flex items-center justify-center`}>
                    <step.icon className={`h-7 w-7 text-${step.color}`} />
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-16 bg-border mt-4" />
                  )}
                </div>

                {/* Content */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prediction Types */}
        <div className="mb-20">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
            Types of Predictions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {predictionTypes.map((type) => (
              <div
                key={type.title}
                className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <h3 className="font-display text-lg font-bold mb-2">{type.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                <div className="px-3 py-2 rounded-lg bg-muted text-sm font-mono">
                  {type.example}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Linera */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
            Why We Built on <span className="text-primary">Linera</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-primary/30 bg-primary/5">
              <Clock className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">Sub-Second Finality</h3>
              <p className="text-muted-foreground">
                Traditional blockchains take 15-60 seconds for confirmation. 
                Linera settles transactions in under 1 second, perfect for live betting.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-secondary/30 bg-secondary/5">
              <Zap className="h-8 w-8 text-secondary mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">Microchain Architecture</h3>
              <p className="text-muted-foreground">
                Each user gets their own microchain, enabling parallel transaction processing 
                and unlimited scalability for high-volume betting.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-success/30 bg-success/5">
              <Coins className="h-8 w-8 text-success mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">Low Gas Fees</h3>
              <p className="text-muted-foreground">
                Linera's efficient architecture means minimal transaction costs, 
                making micro-bets economically viable.
              </p>
            </div>
            
            <div className="p-6 rounded-xl border border-accent/30 bg-accent/5">
              <Shield className="h-8 w-8 text-accent mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">Full Transparency</h3>
              <p className="text-muted-foreground">
                All bets, odds, and settlements are on-chain and verifiable. 
                No hidden house edge or manipulation possible.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {[
              {
                q: 'What tokens do I use for betting?',
                a: 'LivePredict uses LPT (LivePredict Tokens) on the Linera testnet. New users receive 1000 LPT when they connect their wallet.',
              },
              {
                q: 'How are odds calculated?',
                a: 'Odds are calculated using a parimutuel system based on the betting pool. The more people bet on an outcome, the lower the odds become.',
              },
              {
                q: 'What happens if a market closes before the event?',
                a: 'Markets have countdown timers. Once closed, no new bets are accepted. The event outcome determines winners.',
              },
              {
                q: 'Is this real money betting?',
                a: 'Currently, LivePredict operates on Linera testnet with testnet tokens. This is for demonstration and entertainment purposes.',
              },
              {
                q: 'Which esports are supported?',
                a: 'We currently support Counter-Strike 2 (CS2) and Valorant. More games will be added based on community demand.',
              },
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-xl border border-border bg-card">
                <h3 className="font-display font-bold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="p-8 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5 glow-primary">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Ready to Start Predicting?
            </h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet and join the community of esports predictors.
            </p>
            {wallet.connected ? (
              <Button 
                asChild 
                size="lg"
                className="font-display font-bold uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to="/matches">
                  View Live Matches
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={connect}
                disabled={isConnecting}
                className="font-display font-bold uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
