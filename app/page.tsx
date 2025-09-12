'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [users, setUsers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch users
      const usersResponse = await fetch('/api/users')
      const usersData = await usersResponse.json()
      if (Array.isArray(usersData)) {
        setUsers(usersData)
      }

      // Fetch orders
      const ordersResponse = await fetch('/api/orders')
      const ordersData = await ordersResponse.json()
      if (Array.isArray(ordersData)) {
        setOrders(ordersData)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Telegram Order Bot Dashboard</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Users ({users.length})</h2>
            {users.length === 0 ? (
              <p className="text-gray-500">No users found</p>
            ) : (
              <div className="space-y-2">
                {users.map((user: any) => (
                  <div key={user.id} className="border-b pb-2">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">Role: {user.role}</p>
                    <p className="text-sm text-gray-500">ID: {user.telegram_id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Orders ({orders.length})</h2>
            {orders.length === 0 ? (
              <p className="text-gray-500">No orders found</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order: any) => (
                  <div key={order.id} className="border-b pb-2">
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-gray-600">Status: {order.status}</p>
                    <p className="text-sm text-gray-500">Address: {order.customer_address}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* API Status */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">API Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <a 
                href="/api/health" 
                className="block bg-green-100 text-green-800 px-4 py-2 rounded hover:bg-green-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Health Check
              </a>
            </div>
            <div className="text-center">
              <a 
                href="/api/telegram/webhook" 
                className="block bg-blue-100 text-blue-800 px-4 py-2 rounded hover:bg-blue-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Webhook
              </a>
            </div>
            <div className="text-center">
              <a 
                href="/api/cron/bot" 
                className="block bg-purple-100 text-purple-800 px-4 py-2 rounded hover:bg-purple-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cron Job
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}