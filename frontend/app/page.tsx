import FinanTrackApp from '@/components/finantrack-app'

export default function Page() {
  return <FinanTrackApp />
}

export const dynamic = 'force-static'

// Frontend prototype routes are represented by the client-side navigation shell.
// The UI is intentionally data-source agnostic for a future REST API integration.
