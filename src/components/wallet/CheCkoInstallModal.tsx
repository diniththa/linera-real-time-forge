import { useState } from 'react';
import { Download, ExternalLink, FolderOpen, Puzzle, CheckCircle2, ChevronRight, ChevronLeft, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CHECKO_INSTALL_URL } from '@/lib/checko';

interface CheCkoInstallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  {
    id: 1,
    title: 'Download CheCko',
    description: 'Visit the CheCko GitHub releases page and download the latest ZIP file for your browser.',
    icon: Download,
    action: {
      label: 'Open Downloads Page',
      url: CHECKO_INSTALL_URL,
    },
    tips: [
      'Look for the latest release version',
      'Download the ZIP file (e.g., checko-chrome-v1.x.x.zip)',
      'Save it somewhere easy to find',
    ],
  },
  {
    id: 2,
    title: 'Extract the ZIP',
    description: 'Unzip the downloaded file to a permanent folder on your computer.',
    icon: FolderOpen,
    tips: [
      'Right-click the ZIP → "Extract All" (Windows) or double-click (Mac)',
      'Choose a permanent location (don\'t delete this folder later)',
      'You should see a folder with extension files inside',
    ],
  },
  {
    id: 3,
    title: 'Open Extensions Page',
    description: 'Navigate to your browser\'s extension management page.',
    icon: Puzzle,
    tips: [
      'Chrome: Go to chrome://extensions',
      'Brave: Go to brave://extensions',
      'Edge: Go to edge://extensions',
      'Enable "Developer mode" toggle (top-right corner)',
    ],
  },
  {
    id: 4,
    title: 'Load the Extension',
    description: 'Click "Load unpacked" and select the extracted CheCko folder.',
    icon: CheckCircle2,
    tips: [
      'Click "Load unpacked" button',
      'Navigate to the extracted folder',
      'Select the folder containing manifest.json',
      'CheCko icon should appear in your toolbar!',
    ],
  },
];

export function CheCkoInstallModal({ open, onOpenChange }: CheCkoInstallModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
    } else {
      onOpenChange(false);
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-primary" />
            Install CheCko Wallet
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                  idx === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : idx < currentStep
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {idx < currentStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  s.id
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-8 sm:w-12 mx-1',
                    idx < currentStep ? 'bg-success' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <step.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">{step.title}</h3>
              <p className="text-muted-foreground text-sm mt-1">{step.description}</p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            {step.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">{tip}</span>
              </div>
            ))}
          </div>

          {/* Action Button (if any) */}
          {step.action && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(step.action.url, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {step.action.label}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="font-semibold"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>

          <Button
            onClick={handleNext}
            className="font-semibold bg-primary text-primary-foreground"
          >
            {isLastStep ? 'Done' : 'Next'}
            {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
