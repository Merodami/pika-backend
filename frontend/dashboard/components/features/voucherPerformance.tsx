import { getTranslations } from 'next-intl/server'

import type { LocaleProps } from '@/types/common'

interface VoucherPerformanceProps extends LocaleProps {
  businessId: string
}

export async function VoucherPerformance({ locale }: VoucherPerformanceProps) {
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  // Mock voucher performance data
  const topVouchers = [
    { id: '1', title: '20% Off Pizza', redemptions: 45, views: 230 },
    { id: '2', title: 'Buy 1 Get 1 Coffee', redemptions: 38, views: 189 },
    { id: '3', title: 'Free Dessert', redemptions: 27, views: 145 },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('topPerformingVouchers')}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('voucher')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('redemptions')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('views')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('conversionRate')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {topVouchers.map((voucher) => {
              const conversionRate = (
                (voucher.redemptions / voucher.views) *
                100
              ).toFixed(1)

              return (
                <tr key={voucher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {voucher.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {voucher.redemptions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {voucher.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conversionRate}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
