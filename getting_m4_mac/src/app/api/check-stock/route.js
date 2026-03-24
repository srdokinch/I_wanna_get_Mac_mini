// Cron で毎回確実に実行されるようキャッシュを無効化（Vercel 推奨）
export const dynamic = "force-dynamic";

import { pushLineNotify, DEFAULT_LINE_MESSAGE } from "@/lib/linePush";

// 公式の Mac mini 整備品ページ。リダイレクトなしで 200 が返れば「ページにたどり着けた」= OK
const APPLE_REFURB_MAC_MINI_URL =
  "https://www.apple.com/jp/shop/refurbished/mac/mac-mini";

const REDIRECT_STATUSES = [301, 302, 307, 308];

/**
 * mac-mini ページにリダイレクトなしでたどり着けたかだけを判定する。
 * スクレイピングは行わない。
 */
async function checkMacMiniPageReachable() {
  const res = await fetch(APPLE_REFURB_MAC_MINI_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    redirect: "manual",
  });

  if (REDIRECT_STATUSES.includes(res.status)) {
    return { reached: false, redirected: true, error: "redirected" };
  }

  if (res.status === 200) {
    return { reached: true, redirected: false };
  }

  return { reached: false, redirected: false, error: `HTTP ${res.status}` };
}

export async function GET(request) {
  try {
    // cron がどの URL（Host）で叩いたか確認用（Vercel Logs に表示される）
    const host = request.headers.get("host") || "(none)";
    const url = request.url || "(none)";
    console.log("[check-stock] invoked", { host, url });

    const result = await checkMacMiniPageReachable();

    let notifyResult;
    if (result.reached) {
      // 以前は /api/notify へ fetch していたが、同一デプロイへの内部 HTTP が
      // 環境によっては届かず LINE が送られないことがあったため、直接 LINE API を呼ぶ。
      notifyResult = await pushLineNotify(DEFAULT_LINE_MESSAGE);
      if (!notifyResult.sent) {
        console.error("[check-stock] LINE notify failed", notifyResult.error);
      } else {
        console.log("[check-stock] LINE notify ok");
      }
    }

    return Response.json({
      reached: result.reached,
      redirected: result.redirected || undefined,
      error: result.error || undefined,
      ...(notifyResult !== undefined && {
        notify: notifyResult.sent ? { sent: true } : { sent: false, error: notifyResult.error },
      }),
    });
  } catch (e) {
    return Response.json(
      { reached: false, error: e.message },
      { status: 500 }
    );
  }
}
