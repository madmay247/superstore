"use client";

/* Shown instead of a blank page if anything in the app crashes */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="pub pub-missing">
      <h1>Something went wrong on our side</h1>
      <p>Your store is saved. Try again, or reload the page.</p>
      <button type="button" className="pub-home" onClick={reset}>Try again</button>
    </div>
  );
}
