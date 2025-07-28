import { User } from 'lucide-react'

export function RecentCustomers() {
  // Mock data - in production this would come from API
  const customers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      lastVisit: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      vouchersRedeemed: 3,
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      lastVisit: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      vouchersRedeemed: 1,
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      lastVisit: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      vouchersRedeemed: 5,
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Recent Customers</h2>

      <div className="space-y-4">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{customer.name}</p>
                <p className="text-sm text-gray-500">{customer.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {customer.vouchersRedeemed} vouchers
              </p>
              <p className="text-xs text-gray-500">
                {new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
                  Math.round(
                    (customer.lastVisit.getTime() - Date.now()) /
                      (1000 * 60 * 60)
                  ),
                  'hour'
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
