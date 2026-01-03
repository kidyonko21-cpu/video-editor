import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { videoUrl, prompt } = await req.json();
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Mock response for now (real AI backend coming soon)
  return NextResponse.json({ 
    jobId: 'mock-' + Date.now(),
    message: 'Backend coming soon!'
  });
}
