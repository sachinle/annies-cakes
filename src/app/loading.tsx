import { CakeLoader } from "@/components/ui/CakeLoader";

// Root fallback, used for any route without a more specific one.
//
// Its real job is to make navigation *instant*: with a loading file
// present, the router can commit the new route immediately and stream
// the page in behind this, instead of holding the old page on screen
// while the server works.
// Reserves a full viewport.
//
// This is the Cumulative Layout Shift fix, and it is the whole reason
// the number was 0.321. A short loading fallback makes the streamed
// page briefly only a few hundred pixels tall, which pulls the footer
// up into view — Lighthouse even picked the footer tagline as the LCP
// element. When the real content arrives the footer drops thousands of
// pixels, and because it was visible at the time, that move is counted
// in full.
//
// CLS only scores elements that are actually in the viewport, so
// holding the fallback at one screen keeps the footer below the fold
// and the shift never counts.
export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-20">
      <CakeLoader />
    </div>
  );
}
