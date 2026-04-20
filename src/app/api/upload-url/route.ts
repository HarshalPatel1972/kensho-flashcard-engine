import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      // Explicitly pass the token to avoid auto-detection failure in Edge
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ["application/pdf"],
          tokenPayload: JSON.stringify({
            // Sent back upon completion
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Handle post-upload logic here if needed
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[Vercel Blob Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
