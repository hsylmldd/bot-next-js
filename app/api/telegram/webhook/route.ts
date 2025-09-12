import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Process webhook update
    console.log('Webhook received:', body);
    
    // Bot logic will be handled by external service
    // For now, just acknowledge the webhook
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Webhook endpoint is working' });
}