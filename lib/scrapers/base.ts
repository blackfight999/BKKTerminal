import * as cheerio from 'cheerio';

// Realistic browser headers to avoid basic bot detection
export const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'max-age=0',
  'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

export const JSON_HEADERS = {
  ...BROWSER_HEADERS,
  'Accept': 'application/json, text/plain, */*',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Site': 'same-origin',
};

export async function fetchPage(url: string, retries = 2): Promise<{ html: string; ok: boolean; status: number }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
      const res = await fetch(url, {
        headers: BROWSER_HEADERS,
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
      const html = await res.text();
      return { html, ok: res.ok, status: res.status };
    } catch (err) {
      if (attempt === retries) {
        console.error(`[fetch] Failed ${url}:`, err);
        return { html: '', ok: false, status: 0 };
      }
    }
  }
  return { html: '', ok: false, status: 0 };
}

export async function fetchJSON<T>(url: string, extraHeaders: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { ...JSON_HEADERS, ...extraHeaders },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`[fetchJSON] ${res.status} ${url}`);
      return null;
    }
    return res.json() as Promise<T>;
  } catch (err) {
    console.error(`[fetchJSON] Failed ${url}:`, err);
    return null;
  }
}

// Extract __NEXT_DATA__ embedded JSON from Next.js pages
export function extractNextData(html: string): Record<string, unknown> | null {
  const $ = cheerio.load(html);
  const script = $('#__NEXT_DATA__').html();
  if (!script) return null;
  try {
    return JSON.parse(script);
  } catch {
    return null;
  }
}

// Extract any window.__* JSON from inline scripts
export function extractInlineJSON(html: string, varName: string): unknown {
  const pattern = new RegExp(`(?:window\\.${varName}|var ${varName})\\s*=\\s*(\\{[\\s\\S]*?\\});`, 'i');
  const match = html.match(pattern);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
