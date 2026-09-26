import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { commerce } from '@/content/site-content'

const MONGO_URL = process.env.MONGO_URL
const DB_NAME = process.env.DB_NAME || 'sunny_magnet'
const GAS_WEBHOOK_URL = process.env.GAS_WEBHOOK_URL || ''

let client
let clientPromise

async function getDb() {
  if (!clientPromise) {
    client = new MongoClient(MONGO_URL)
    clientPromise = client.connect()
  }
  await clientPromise
  return client.db(DB_NAME)
}

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  return res
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }))
}

export async function GET(request, context) {
  const params = await context.params
  const path = (params?.path || []).join('/')
  try {
    if (path === '' || path === 'health') {
      return cors(NextResponse.json({ ok: true, service: 'sunny-magnet' }))
    }
    if (path === 'leads') {
      const db = await getDb()
      const leads = await db.collection('leads').find({}).sort({ createdAt: -1 }).limit(100).toArray()
      const cleaned = leads.map(({ _id, ...rest }) => rest)
      return cors(NextResponse.json({ leads: cleaned }))
    }
    return cors(NextResponse.json({ error: 'Not found' }, { status: 404 }))
  } catch (e) {
    return cors(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}

export async function POST(request, context) {
  const params = await context.params
  const path = (params?.path || []).join('/')
  try {
    const body = await request.json()
    if (path === 'leads') {
      const { fullName, phone, address, email, delivery, referralCode, quantity, notes, language } = body || {}
      if (!fullName || !phone) {
        return cors(NextResponse.json({ error: 'fullName and phone are required' }, { status: 400 }))
      }
      const qty = quantity ? Number(quantity) : 0
      const lead = {
        id: uuidv4(),
        fullName: String(fullName).trim(),
        phone: String(phone).trim(),
        address: (address || '').trim(),
        email: (email || '').trim(),
        delivery: (delivery || '').trim(),
        referralCode: (referralCode || '').trim(),
        quantity: qty || null,
        notes: (notes || '').trim(),
        language: language || 'en',
        source: 'landing_page',
        createdAt: new Date().toISOString(),
      }
      const db = await getDb()
      await db.collection('leads').insertOne({ ...lead })

      // Forward to Google Apps Script webhook if configured
      let webhookStatus = 'not_configured'
      if (GAS_WEBHOOK_URL) {
        try {
          const r = await fetch(GAS_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lead),
          })
          webhookStatus = r.ok ? 'forwarded' : `webhook_error_${r.status}`
        } catch (err) {
          webhookStatus = 'webhook_failed'
        }
      }

      // Build a mock order response so the Thank You screen can render
      const totalNumber = qty * commerce.unitPrice
      const totalFormatted = totalNumber.toLocaleString('vi-VN') + 'đ'
      const orderId = 'SM-' + Date.now().toString(36).toUpperCase().slice(-8)
      // Public placeholder VietQR image (real backend should replace with actual VietQR URL)
      const qrData = `ORDER:${orderId} AMOUNT:${totalNumber} NAME:${lead.fullName}`
      const vietQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(qrData)}`

      return cors(NextResponse.json({
        success: true,
        lead,
        webhookStatus,
        // Mock order fields for the Thank You screen
        orderId,
        totalPrice: totalFormatted,
        vietQrUrl,
        message: 'Order received',
      }))
    }
    return cors(NextResponse.json({ error: 'Not found' }, { status: 404 }))
  } catch (e) {
    return cors(NextResponse.json({ error: e.message }, { status: 500 }))
  }
}
