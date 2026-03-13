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

export async function GET() {
  try {
    const result = await checkMacMiniPageReachable();
    return Response.json({
      reached: result.reached,
      redirected: result.redirected || undefined,
      error: result.error || undefined,
    });
  } catch (e) {
    return Response.json(
      { reached: false, error: e.message },
      { status: 500 }
    );
  }
}
