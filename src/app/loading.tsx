import { CakeLoader } from "@/components/ui/CakeLoader";

// Root fallback, used for any route without a more specific one.
//
// Its real job is to make navigation *instant*: with a loading file
// present, the router can commit the new route immediately and stream
// the page in behind this, instead of holding the old page on screen
// while the server works.
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-20">
      <CakeLoader />
    </div>
  );
}
