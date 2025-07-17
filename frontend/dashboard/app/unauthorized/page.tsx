import { Button, Result } from 'antd'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Link href="/dashboard">
            <Button type="primary">Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  )
}
