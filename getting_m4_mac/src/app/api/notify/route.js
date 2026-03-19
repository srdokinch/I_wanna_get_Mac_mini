import {
  pushLineNotify,
  DEFAULT_LINE_MESSAGE,
} from "@/lib/linePush";

export async function GET() {
  return handleNotify(DEFAULT_LINE_MESSAGE);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = body.message || DEFAULT_LINE_MESSAGE;
    return handleNotify(message);
  } catch (e) {
    return Response.json(
      { ok: false, sent: false, error: e.message },
      { status: 500 }
    );
  }
}

async function handleNotify(message) {
  try {
    const result = await pushLineNotify(message);

    if (!result.sent) {
      return Response.json(
        { ok: false, ...result },
        { status: 400 }
      );
    }

    return Response.json({ ok: true, sent: true });
  } catch (e) {
    return Response.json(
      { ok: false, sent: false, error: e.message },
      { status: 500 }
    );
  }
}
