import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Allow the landing page and the Vercel Blob handshake to be public
// The handshake itself is secured by the BLOB_READ_WRITE_TOKEN
const isPublicRoute = createRouteMatcher(["/", "/api/upload-url(.*)"]);

const proxy = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export default proxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
