import { Skeleton as AntSkeleton } from 'antd'

interface SkeletonProps {
  className?: string
  height?: number | string
  width?: number | string
  rows?: number
}

export function Skeleton({ className, height, width, rows }: SkeletonProps) {
  return (
    <AntSkeleton
      active
      className={className}
      paragraph={rows ? { rows } : false}
      style={{ height, width }}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <Skeleton height={20} width="40%" className="mb-2" />
      <Skeleton height={32} width="60%" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <Skeleton height={24} width="30%" />
      </div>
      <div className="p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 mb-4">
            <Skeleton height={40} width={40} className="rounded-full" />
            <div className="flex-1">
              <Skeleton height={16} width="30%" className="mb-2" />
              <Skeleton height={14} width="50%" />
            </div>
            <Skeleton height={32} width={80} />
          </div>
        ))}
      </div>
    </div>
  )
}
