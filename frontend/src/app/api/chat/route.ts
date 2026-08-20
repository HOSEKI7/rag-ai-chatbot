import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendBaseUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://localhost:8000";

    const targetUrl = `${backendBaseUrl.replace(/\/$/, "")}/api/v1/chat`;

    const backendRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      return new NextResponse(errorText || "Backend stream failed", {
        status: backendRes.status,
      });
    }

    // Stream the SSE response directly to the client
    return new NextResponse(backendRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: unknown) {
    const message = (err as Error)?.message || "Internal Next.js proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
