import { notFound } from 'next/navigation'

// Catch-all segment to handle unknown routes
export default function CatchAllPage() {
  notFound()
}
