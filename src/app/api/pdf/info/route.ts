import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractPDFInfo } from "@/lib/pdf-extract";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch PDF");
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const { totalPages } = await extractPDFInfo(buffer);
    
    return NextResponse.json({ totalPages });
  } catch (error) {
    console.error("PDF Info Error:", error);
    return NextResponse.json(
      { error: "Could not read PDF structure. The file might be corrupted or inaccessible." },
      { status: 422 }
    );
  }
}
