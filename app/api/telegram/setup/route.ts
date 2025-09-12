import { NextRequest, NextResponse } from 'next/server'
import { bot } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL
    
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 400 })
    }
    
    // Set webhook
    await bot.setWebHook(`${webhookUrl}/api/telegram/webhook`)
    
    // Get webhook info
    const webhookInfo = await bot.getWebHookInfo()
    
    return NextResponse.json({
      message: 'Webhook setup successful',
      webhookInfo
    })
  } catch (error) {
    console.error('Webhook setup error:', error)
    return NextResponse.json({ error: 'Failed to setup webhook' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const webhookInfo = await bot.getWebHookInfo()
    return NextResponse.json({ webhookInfo })
  } catch (error) {
    console.error('Get webhook info error:', error)
    return NextResponse.json({ error: 'Failed to get webhook info' }, { status: 500 })
  }
}
