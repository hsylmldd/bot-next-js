# API Documentation

## Overview
This document describes the REST API endpoints for the Telegram Order Management Bot.

## Base URL
```
https://your-domain.com/api
```

## Authentication
All API endpoints require proper Supabase authentication headers.

## Endpoints

### Users

#### GET /users
Get all users in the system.

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "telegram_id": "string",
      "role": "HD" | "Teknisi",
      "name": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

#### POST /users
Create a new user.

**Request Body:**
```json
{
  "telegram_id": "string",
  "name": "string",
  "role": "HD" | "Teknisi"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "telegram_id": "string",
    "role": "HD" | "Teknisi",
    "name": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### Orders

#### GET /orders
Get all orders with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by order status
- `technician` (optional): Filter by assigned technician ID

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "customer_name": "string",
      "customer_address": "string",
      "contact": "string",
      "assigned_technician": "uuid",
      "status": "Pending" | "In Progress" | "On Hold" | "Completed" | "Closed",
      "sod_time": "timestamp",
      "e2e_time": "timestamp",
      "lme_pt2_start": "timestamp",
      "lme_pt2_end": "timestamp",
      "sla_deadline": "timestamp",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "technician": {
        "name": "string"
      },
      "progress": [
        {
          "id": "uuid",
          "stage": "Survey" | "Penarikan" | "P2P" | "Instalasi" | "Catatan",
          "status": "Ready" | "Not Ready" | "Selesai",
          "note": "string",
          "timestamp": "timestamp"
        }
      ],
      "evidence": [
        {
          "id": "uuid",
          "odp_name": "string",
          "ont_sn": "string",
          "photo_sn_ont": "string",
          "photo_technician_customer": "string",
          "photo_customer_house": "string",
          "photo_odp_front": "string",
          "photo_odp_inside": "string",
          "photo_label_dc": "string",
          "photo_test_result": "string",
          "uploaded_at": "timestamp"
        }
      ]
    }
  ]
}
```

#### POST /orders
Create a new order.

**Request Body:**
```json
{
  "customer_name": "string",
  "customer_address": "string",
  "contact": "string",
  "assigned_technician": "uuid",
  "sod_time": "timestamp",
  "e2e_time": "timestamp"
}
```

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "customer_name": "string",
    "customer_address": "string",
    "contact": "string",
    "assigned_technician": "uuid",
    "status": "Pending",
    "sod_time": "timestamp",
    "e2e_time": "timestamp",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### Telegram Webhook

#### POST /telegram/webhook
Telegram webhook endpoint for receiving bot updates.

**Request Body:**
```json
{
  "update_id": "number",
  "message": {
    "message_id": "number",
    "from": {
      "id": "number",
      "is_bot": "boolean",
      "first_name": "string",
      "last_name": "string",
      "username": "string"
    },
    "chat": {
      "id": "number",
      "type": "string"
    },
    "date": "number",
    "text": "string"
  }
}
```

**Response:**
```json
{
  "ok": true
}
```

#### POST /telegram/setup
Setup Telegram webhook.

**Response:**
```json
{
  "message": "Webhook setup successful",
  "webhookInfo": {
    "url": "string",
    "has_custom_certificate": "boolean",
    "pending_update_count": "number"
  }
}
```

#### GET /telegram/setup
Get current webhook information.

**Response:**
```json
{
  "webhookInfo": {
    "url": "string",
    "has_custom_certificate": "boolean",
    "pending_update_count": "number"
  }
}
```

### Server Management

#### GET /init
Initialize server services (SLA monitoring, cron jobs).

**Response:**
```json
{
  "message": "Server initialized successfully"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are subject to rate limiting to prevent abuse. If you exceed the rate limit, you'll receive a `429 Too Many Requests` response.

## Webhook Security

Telegram webhooks include signature verification to ensure requests are coming from Telegram. The bot validates webhook signatures automatically.

## Testing

Use the provided test scripts to verify your setup:

```bash
# Test database connection
node scripts/test-db.js test

# Create sample data
node scripts/test-db.js sample

# Setup Telegram webhook
node scripts/setup-bot.js setup

# Get bot information
node scripts/setup-bot.js info
```
