import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { put } from '@vercel/blob';
import connectDB from '@/lib/mongodb';
import FileObject from '@/models/FileObject';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const userId = decoded.userId;

    const form = await req.formData();
    const file = form.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Invalid file format' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    });

    // Store file reference in MongoDB
    await connectDB();
    const fileDoc = new FileObject({
      ownerId: userId,
      key: blob.url,
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      blobUrl: blob.url,
      downloadUrl: blob.downloadUrl,
      storageType: 'blob',
    });

    await fileDoc.save();

    // Return simple file reference
    return NextResponse.json({
      id: fileDoc._id,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      uploadedAt: new Date().toISOString()
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message ?? 'upload failed' }, 
      { status: 500 }
    );
  }
}