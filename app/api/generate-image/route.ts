export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for image generation

import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';

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
    <text x="200" y="172" font-family="system-ui,sans-serif" font-size="15" font-weight="bold" fill="#1e293b" text-anchor="middle">AI Illustration</text>
    <text x="200" y="198" font-family="system-ui,sans-serif" font-size="11" fill="#4f46e5" text-anchor="middle">${reason}</text>
  </svg>`;
}

async function generateImage(prompt: string): Promise<Buffer | null> {
  const encoded = encodeURIComponent(prompt);
  // Use a random seed so every generation is unique
  const seed = Math.floor(Math.random() * 9999999);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;
  console.log(`[generate-image] Calling: ${url}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55_000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) {
      console.error(`[generate-image] HTTP ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err: any) {
    clearTimeout(timer);
    console.error(`[generate-image] Fetch error: ${err?.message}`);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get('prompt');
    const name = searchParams.get('name');

    if (!prompt) {
      return new Response(getPlaceholderSvg('No prompt provided'), {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
      });
    }

    const cleanName = (name || '')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase() || `img_${Math.random().toString(36).substring(7)}`;

    const publicDir = path.join(process.cwd(), 'public');
    const targetDir = path.join(publicDir, 'illustrations', 'generated');
    const filePath = path.join(targetDir, `${cleanName}.jpg`);

    // Cache hit
    if (fs.existsSync(filePath)) {
      console.log(`[generate-image] Cache hit: ${cleanName}.jpg`);
      const fileBuffer = fs.readFileSync(filePath);
      return new Response(fileBuffer, {
        headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
      });
    }

    const buffer = await generateImage(prompt);
    if (!buffer) {
      return new Response(getPlaceholderSvg('Generation Failed — Try Again'), {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
      });
    }

    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(filePath, buffer);
    console.log(`[generate-image] Saved: ${filePath}`);

    return new Response(buffer, {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch (error: any) {
    console.error('[generate-image] Error:', error?.message ?? error);
    return new Response(getPlaceholderSvg('Error — ' + (error?.message ?? 'Unknown')), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' },
    });
  }
}
