export default function Features() {
  return (
    <div className="bg-muted text-foreground py-16 px-8">
      <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Workout Tracking</h3>
          <p className="text-muted-foreground">
            Log your exercises, sets, reps, and weights.
          </p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Progress Analytics</h3>
          <p className="text-muted-foreground">
            Visualize your progress with detailed charts.
          </p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Workout Planning</h3>
          <p className="text-muted-foreground">
            Create and schedule your workouts in advance.
          </p>
        </div>
        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Exercise Library</h3>
          <p className="text-muted-foreground">
            Access a comprehensive library of exercises.
          </p>
        </div>
      </div>
    </div>
  );
}
