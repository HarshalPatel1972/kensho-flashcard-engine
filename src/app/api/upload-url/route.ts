import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  // CULPRIT CHECK: If this is missing, the frontend will fallback to v1/blob (CORS error)
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("CRITICAL: BLOB_READ_WRITE_TOKEN is missing from Vercel environment.");
    return NextResponse.json(
      { error: "Storage not configured. Please link Blob storage in Vercel Dashboard." },
      { status: 500 }
    );
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["application/pdf"],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
