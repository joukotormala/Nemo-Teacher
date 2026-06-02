export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { query, locale } = await request.json();

    if (!query?.trim()) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    const lang = locale === 'th' ? 'Thai' : locale === 'sv' ? 'Swedish' : 'English';

    // ── Step 1: Web search via Gemini with Google Search grounding ────────────
    let summary = '';
    let sources: { title: string; url: string; snippet: string }[] = [];
    let searchImages: { url: string; title: string; source: string }[] = [];

    if (GEMINI_API_KEY) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `Search for educational information about: "${query}". Provide a clear, student-friendly summary in ${lang}. Keep it concise (3-5 sentences).` }],
                role: 'user',
              }],
              tools: [{ googleSearch: {} }],
              generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          summary = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

          // Extract grounding sources
          const groundingMeta = data?.candidates?.[0]?.groundingMetadata;
          const chunks = groundingMeta?.groundingChunks ?? [];
          sources = chunks
            .filter((c: any) => c?.web?.uri && c?.web?.title)
            .slice(0, 4)
            .map((c: any) => ({
              title: c.web.title,
              url: c.web.uri,
              snippet: '',
            }));
        }
      } catch (err) {
        console.warn('Gemini search failed:', err);
      }
    }

    // ── Step 2: If Gemini failed, fallback to DuckDuckGo instant answer ───────
    if (!summary) {
      try {
        const ddgRes = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
          { headers: { 'Accept': 'application/json' } }
        );
        if (ddgRes.ok) {
          const ddg = await ddgRes.json();
          summary = ddg?.AbstractText || ddg?.Answer || '';
          if (ddg?.AbstractURL) {
            sources.push({
              title: ddg.AbstractSource || 'Wikipedia',
              url: ddg.AbstractURL,
              snippet: summary.slice(0, 120),
            });
          }
          // DuckDuckGo image results
          if (ddg?.Image) {
            searchImages.push({ url: ddg.Image, title: query, source: 'DuckDuckGo' });
          }
        }
      } catch (err) {
        console.warn('DuckDuckGo fallback failed:', err);
      }
    }

    // ── Step 3: Wikipedia images (educational, free, no API key) ─────────────
    try {
      // Try English Wikipedia first for images
      const wikiRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.split(' ').slice(0, 3).join('_'))}`,
        { headers: { 'Accept': 'application/json', 'User-Agent': 'Nemo-Teacher/1.0' } }
      );
      if (wikiRes.ok) {
        const wiki = await wikiRes.json();
        if (wiki?.thumbnail?.source) {
          searchImages.unshift({
            url: wiki.thumbnail.source.replace(/\/\d+px-/, '/400px-'),
            title: wiki.title,
            source: 'Wikipedia',
          });
        }
        if (!summary && wiki?.extract) {
          summary = wiki.extract.split('. ').slice(0, 3).join('. ') + '.';
          sources.unshift({
            title: wiki.title + ' — Wikipedia',
            url: wiki.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${wiki.title}`,
            snippet: wiki.extract.slice(0, 150),
          });
        }
      }
    } catch (err) {
      console.warn('Wikipedia fetch failed:', err);
    }

    // ── Step 4: Additional images via Wikimedia Commons search ────────────────
    try {
      const commonsRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=400&format=json&origin=*`,
        { headers: { 'Accept': 'application/json', 'User-Agent': 'Nemo-Teacher/1.0' } }
      );
      if (commonsRes.ok) {
        const commons = await commonsRes.json();
        const pages = Object.values(commons?.query?.pages ?? {}) as any[];
        for (const page of pages.slice(0, 3)) {
          const imgUrl = page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url;
          const imgTitle = page?.imageinfo?.[0]?.extmetadata?.ImageDescription?.value
            ?.replace(/<[^>]+>/g, '')
            || page?.title?.replace('File:', '') || query;
          if (imgUrl && !imgUrl.includes('.svg') && !imgUrl.includes('.ogg')) {
            searchImages.push({ url: imgUrl, title: imgTitle.slice(0, 80), source: 'Wikimedia' });
          }
        }
      }
    } catch (err) {
      console.warn('Wikimedia fetch failed:', err);
    }

    // Deduplicate images
    const seen = new Set<string>();
    const uniqueImages = searchImages.filter(img => {
      if (seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    }).slice(0, 5);

    return Response.json({
      query,
      summary: summary || `No results found for "${query}". Try a different search term.`,
      sources: sources.slice(0, 4),
      images: uniqueImages,
    });
  } catch (err: any) {
    console.error('Search API error:', err);
    return Response.json({ error: err?.message ?? 'Search failed' }, { status: 500 });
  }
}
