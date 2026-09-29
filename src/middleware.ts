import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes are protected (require login)
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/subjects(.*)",
  "/notes(.*)",
  "/tasks(.*)",
  "/ai-tutor(.*)",
  "/profile(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // If a user tries to visit a protected route without being logged in,
  // redirect them to the sign-in page automatically
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
