import MarketingNav from "@/components/marketing-nav";
import {
  Activity,
  ArrowRight,
  BarChart2,
  Calendar,
  CheckCircle,
  Dumbbell,
} from "lucide-react";
import Link from "next/link";

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNav />

      <main className="flex-1 flex flex-col gap-12 px-4 py-8 sm:px-6 lg:px-8">
        <section className="max-w-4xl mx-auto text-center pt-12 pb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary p-4 rounded-full shadow-md">
              <Dumbbell className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Track Your Fitness Journey with Ease
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            FitFlash helps you track workouts, monitor progress, and achieve
            your fitness goals with a simple, intuitive interface.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className="bg-card border border-border text-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors"
            >
              Learn More
            </Link>
          </div>
        </section>

        <section id="features" className="max-w-6xl mx-auto py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              FitFlash provides all the tools you need to track and improve your
              fitness journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border border-border/60 shadow-sm">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Workout Tracking
              </h3>
              <p className="text-muted-foreground">
                Log your exercises, sets, reps, and weights with an intuitive
                interface designed for the gym.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border/60 shadow-sm">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Progress Analytics
              </h3>
              <p className="text-muted-foreground">
                Visualize your progress with detailed charts and metrics to keep
                you motivated.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border/60 shadow-sm">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Workout Planning
              </h3>
              <p className="text-muted-foreground">
                Create and schedule your workouts in advance to stay consistent
                with your routine.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border/60 shadow-sm">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Exercise Library
              </h3>
              <p className="text-muted-foreground">
                Access a comprehensive library of exercises with instructions
                and muscle targeting information.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border/60 shadow-sm">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Personal Records
              </h3>
              <p className="text-muted-foreground">
                Track your personal bests and celebrate your achievements as you
                progress.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border/60 shadow-sm">
              <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary"
                >
                  <path d="M12 22s-8-4-8-10V5l8-3 8 3v7c0 6-8 10-8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Data Security
              </h3>
              <p className="text-muted-foreground">
                Your fitness data is securely stored and accessible only to you.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-primary text-primary-foreground py-16 sm:py-20 px-6 sm:px-10 rounded-2xl max-w-6xl mx-auto shadow-lg">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              Ready to start your fitness journey?
            </h2>
            <p className="text-lg sm:text-xl mb-10 opacity-90 leading-relaxed">
              Get started with tracking your fitness progress with FitFlash.
            </p>
            <Link
              href="/sign-up"
              className="bg-card text-primary px-8 py-4 sm:px-10 sm:py-4 rounded-xl text-base sm:text-lg font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 inline-flex items-center justify-center gap-2 min-w-[220px]"
            >
              Get Started for Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center flex-col md:flex-row">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="bg-primary p-2 rounded-full">
                <Dumbbell className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="ml-2 text-xl font-bold text-foreground">
                FitFlash
              </span>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <p className="text-muted-foreground text-sm mb-2">
                © 2026 FitFlash. All rights reserved.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/privacy-policy"
                  className="text-muted-foreground hover:text-primary"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms-of-service"
                  className="text-muted-foreground hover:text-primary"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
