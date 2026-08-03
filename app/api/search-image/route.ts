export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

function getPlaceholderSvg(reason: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#f8fafc" rx="16" stroke="#e2e8f0" stroke-width="2"/>
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#c084fc;stop-opacity:0.2"/>
        <stop offset="100%" style="stop-color:#6366f1;stop-opacity:0.2"/>
      </linearGradient>
    </defs>
    <rect width="396" height="296" x="2" y="2" fill="url(#g)" rx="14"/>
    <circle cx="200" cy="110" r="32" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-dasharray="6 4"/>
    <path d="M188 115 l8-8 l6 6 l9-10 l12 12" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/>
    <text x="200" y="172" font-family="system-ui,sans-serif" font-size="15" font-weight="bold" fill="#1e293b" text-anchor="middle">Image Search</text>
    <text x="200" y="198" font-family="system-ui,sans-serif" font-size="11" fill="#4f46e5" text-anchor="middle">${reason}</text>
  </svg>`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return new Response(getPlaceholderSvg('No query provided'), {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
      });
    }

    let imgUrl = '';

    // Step 1: DuckDuckGo instant answer
    try {
      const ddgRes = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (ddgRes.ok) {
        const ddg = await ddgRes.json();
        if (ddg?.Image && !ddg.Image.endsWith('.svg')) {
          imgUrl = ddg.Image.startsWith('/') ? `https://duckduckgo.com${ddg.Image}` : ddg.Image;
        }
      }
    } catch (err) {
      console.warn('DuckDuckGo fallback failed:', err);
    }

    // Step 2: Wikipedia images
    if (!imgUrl) {
      try {
        const wikiRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.split(' ').slice(0, 3).join('_'))}`,
          { headers: { 'Accept': 'application/json', 'User-Agent': 'Nemo-Teacher/1.0' } }
        );
        if (wikiRes.ok) {
          const wiki = await wikiRes.json();
          if (wiki?.thumbnail?.source) {
            imgUrl = wiki.thumbnail.source.replace(/\/\d+px-/, '/400px-');
          }
        }
      } catch (err) {
        console.warn('Wikipedia fetch failed:', err);
      }
    }

    // Step 3: Wikimedia Commons
    if (!imgUrl) {
      try {
        const commonsRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=400&format=json&origin=*`,
          { headers: { 'Accept': 'application/json', 'User-Agent': 'Nemo-Teacher/1.0' } }
        );
        if (commonsRes.ok) {
          const commons = await commonsRes.json();
          const pages = Object.values(commons?.query?.pages ?? {}) as any[];
          for (const page of pages.slice(0, 3)) {
            const url = page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url;
            if (url && !url.includes('.svg') && !url.includes('.ogg')) {
              imgUrl = url;
              break;
            }
          }
        }
      } catch (err) {
        console.warn('Wikimedia fetch failed:', err);
      }
    }

    if (imgUrl) {
      // Return a 302 Redirect to the image URL
      return NextResponse.redirect(imgUrl);
    } else {
      return new Response(getPlaceholderSvg('No pictures found'), {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
      });
    }

  } catch (error: any) {
    console.error('[search-image] Error:', error?.message ?? error);
    return new Response(getPlaceholderSvg('Error — ' + (error?.message ?? 'Unknown')), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
    });
  }
}
