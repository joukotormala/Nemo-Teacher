export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'nemo_admin_jwt_secret_key_2026';

async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('nemo_admin_token')?.value;
    if (!token) return false;
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jose.jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

async function generateImage(prompt: string): Promise<Buffer | null> {
  const encoded = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 9999999);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;
  console.log('[Admin illustrations] Calling Pollinations:', url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55_000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) {
      console.error('[Admin illustrations] Pollinations HTTP', response.status);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err: any) {
    clearTimeout(timer);
    console.error('[Admin illustrations] Fetch error:', err?.message);
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { concept, folder, prompt } = await request.json();

    if (!concept || !prompt) {
      return Response.json({ error: 'concept and prompt are required' }, { status: 400 });
    }

    const cleanConcept = concept.trim().replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const cleanFolder = (folder || 'generated').trim().replace(/[^a-zA-Z0-9_/-]/g, '_').toLowerCase();

    const storagePath = `${cleanFolder}/${cleanConcept}.jpg`;
    console.log(`[Admin illustrations] Generating "${concept}" → ${storagePath}`);

    const buffer = await generateImage(prompt);
    if (!buffer) {
      return Response.json({ error: 'Image generation timed out or failed. Pollinations.ai may be busy — please try again.' }, { status: 502 });
    }

    // Upload to Supabase Storage (works on Vercel — no filesystem writes needed)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/illustrations/${storagePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true',
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('[Admin illustrations] Supabase upload error:', errText);
      return Response.json({ error: `Storage upload failed: ${errText}` }, { status: 500 });
    }

    const publicPath = `${supabaseUrl}/storage/v1/object/public/illustrations/${storagePath}`;
    console.log(`[Admin illustrations] Saved to Supabase: ${publicPath}`);

    const mapEntry = `'${cleanConcept}': '${publicPath}',`;
    return Response.json({ success: true, path: publicPath, mapEntry });
  } catch (error: any) {
    console.error('[Admin illustrations] Error:', error);
    return Response.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

// List all existing illustration files from Supabase Storage
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Recursively list all files in the illustrations bucket
    async function listFolder(prefix: string): Promise<{ path: string; name: string; folder: string }[]> {
      const res = await fetch(`${supabaseUrl}/storage/v1/object/list/illustrations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefix, limit: 1000, offset: 0 }),
      });
      if (!res.ok) return [];
      const items: any[] = await res.json();
      const results: { path: string; name: string; folder: string }[] = [];

      for (const item of items) {
        if (item.id === null) {
          // It's a "folder" — recurse into it
          const subPrefix = prefix ? `${prefix}${item.name}/` : `${item.name}/`;
          const sub = await listFolder(subPrefix);
          results.push(...sub);
        } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.name)) {
          const fullPath = prefix ? `${prefix}${item.name}` : item.name;
          const folderName = prefix ? prefix.replace(/\/$/, '') : 'root';
          results.push({
            path: `${supabaseUrl}/storage/v1/object/public/illustrations/${fullPath}`,
            name: item.name.replace(/\.[^.]+$/, ''),
            folder: folderName,
          });
        }
      }
      return results;
    }

    const illustrations = await listFolder('');
    return Response.json({ illustrations });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
