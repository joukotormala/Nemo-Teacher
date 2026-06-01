export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';
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

    const publicDir = path.join(process.cwd(), 'public');
    const targetDir = path.join(publicDir, 'illustrations', cleanFolder);
    const filePath = path.join(targetDir, `${cleanConcept}.jpg`);
    const publicPath = `/illustrations/${cleanFolder}/${cleanConcept}.jpg`;

    console.log(`[Admin illustrations] Generating "${concept}" → ${publicPath}`);

    const buffer = await generateImage(prompt);
    if (!buffer) {
      return Response.json({ error: 'Image generation timed out or failed. Pollinations.ai may be busy — please try again.' }, { status: 502 });
    }

    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(filePath, buffer);
    console.log(`[Admin illustrations] Saved: ${filePath}`);

    const mapEntry = `'${cleanConcept}': '${publicPath}',`;
    return Response.json({ success: true, path: publicPath, mapEntry });
  } catch (error: any) {
    console.error('[Admin illustrations] Error:', error);
    return Response.json({ error: error.message ?? 'Internal server error' }, { status: 500 });
  }
}

// List all existing illustration files
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const publicDir = path.join(process.cwd(), 'public', 'illustrations');
    const results: { path: string; name: string; folder: string }[] = [];

    function walk(dir: string, relative: string) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir)) {
        if (entry.startsWith('.')) continue;
        const full = path.join(dir, entry);
        const rel = relative ? `${relative}/${entry}` : entry;
        if (fs.statSync(full).isDirectory()) {
          walk(full, rel);
        } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(entry)) {
          results.push({
            path: `/illustrations/${rel}`,
            name: entry.replace(/\.[^.]+$/, ''),
            folder: relative || 'root',
          });
        }
      }
    }

    walk(publicDir, '');
    return Response.json({ illustrations: results });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
