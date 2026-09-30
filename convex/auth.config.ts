import type { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain:
        process.env.CLERK_JWT_ISSUER_DOMAIN ||
        process.env.CLERK_FRONTEND_API_URL ||
        "https://composed-stud-2858.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
