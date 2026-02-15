import { Button } from '@/components/ui/button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg p-6 text-center">
      <div className="space-y-6 max-w-md">
        <div className="space-y-3">
          <h1 className="text-8xl font-bold text-brand-primary">404</h1>
          <h2 className="text-2xl font-semibold text-brand-foreground">Page Not Found</h2>
          <p className="text-brand-foreground/70">The page you're looking for doesn't exist or may have been moved.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-brand-primary text-brand-bg hover:bg-brand-primary/90">
            <a href="/">Return Home</a>
          </Button>
          <Button variant="outline" className="border-white/20 text-brand-foreground hover:bg-white/10" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
