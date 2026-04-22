import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Allow the landing page, documentation, and the Vercel Blob handshake to be public
const isPublicRoute = createRouteMatcher(["/", "/docs(.*)", "/api/upload-url(.*)"]);

const middleware = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export default middleware;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
