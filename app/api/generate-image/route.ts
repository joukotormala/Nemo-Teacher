export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';

function getPlaceholderSvg(reason: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <rect width="400" height="300" fill="#f8fafc" rx="16" ry="16" stroke="#e2e8f0" stroke-width="2"/>
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#c084fc;stop-opacity:0.15" />
        <stop offset="100%" style="stop-color:#6366f1;stop-opacity:0.15" />
      </linearGradient>
    </defs>
    <rect width="396" height="296" x="2" y="2" fill="url(#grad)" rx="14" ry="14" />
    <g fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="200" cy="100" r="30" stroke-dasharray="4 4" />
      <!-- Drawing a simple placeholder image icon inside the circle -->
      <path d="M190 105 l7 -7 l5 5 l8 -8" />
    </g>
    <text x="200" y="165" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="bold" fill="#1e293b" text-anchor="middle">AI Illustration</text>
    <text x="200" y="195" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="medium" fill="#4f46e5" text-anchor="middle">${reason}</text>
    <text x="200" y="225" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Google AI Studio Paid Account Required</text>
    <text x="200" y="245" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">Please upgrade your plan to enable dynamic images</text>
  </svg>`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get('prompt');
    const name = searchParams.get('name');

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Clean name to make a safe filename
    const cleanName = (name || '')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase() || `img_${Math.random().toString(36).substring(7)}`;

    const publicDir = path.join(process.cwd(), 'public');
    const targetDir = path.join(publicDir, 'illustrations', 'generated');
    const filePath = path.join(targetDir, `${cleanName}.jpg`);

    // Check Cache
    if (fs.existsSync(filePath)) {
      console.log(`[Cache Hit] Serving generated image: ${cleanName}.jpg`);
      const fileBuffer = fs.readFileSync(filePath);
      return new Response(fileBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Cache Miss - Generate using Imagen 4
    console.log(`[Cache Miss] Generating image for prompt: "${prompt}" -> ${cleanName}.jpg`);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Imagen Config Error] GEMINI_API_KEY is not configured');
      const svg = getPlaceholderSvg('API Key Not Configured');
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Use current active model (imagen-4.0-generate-001)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '1:1',
          outputMimeType: 'image/jpeg',
        },
      }),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error('Imagen 4 API error:', errText);
      
      let friendlyReason = 'Generation Unavailable';
      if (errText.includes('paid plans') || apiResponse.status === 400 || apiResponse.status === 429) {
        friendlyReason = 'Upgrade to Paid Plan Required';
      }
      
      const svg = getPlaceholderSvg(friendlyReason);
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
        },
      });
    }

    const data = await apiResponse.json();
    const base64Image = data?.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Image) {
      console.error('No image bytes returned in Imagen response:', data);
      const svg = getPlaceholderSvg('Invalid API Response');
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Convert to buffer and save to local directory
    const buffer = Buffer.from(base64Image, 'base64');
    
    // Ensure directories exist
    fs.mkdirSync(targetDir, { recursive: true });
    
    // Write image file
    fs.writeFileSync(filePath, buffer);
    console.log(`[Cache Write] Saved generated image to: ${filePath}`);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Image generation route error:', error);
    const svg = getPlaceholderSvg('Internal Server Error');
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  }
}
