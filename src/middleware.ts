import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Explicitly define public routes — everything else is protected
const isPublicRoute = createRouteMatcher([
  "/",                    // Landing page
  "/login(.*)",           // Login + all Clerk sub-steps
  "/signup(.*)",          // Signup + all Clerk sub-steps
  "/sign-in(.*)",         // Clerk internal sign-in
  "/sign-up(.*)",         // Clerk internal sign-up
]);

export default clerkMiddleware(async (auth, req) => {
  // If the route is NOT public, protect it
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
