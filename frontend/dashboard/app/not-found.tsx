import { redirect } from 'next/navigation'

// Root not-found redirects to default locale
export default function RootNotFound() {
  redirect('/es')
}