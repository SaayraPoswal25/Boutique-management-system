import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

/** UI-13: never a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="mx-auto mt-24 max-w-md rounded-xl border bg-card p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">Something went wrong</h1>
        <Button variant="primary" onClick={() => { window.location.hash = '#/'; window.location.reload() }}>Go Back to Home</Button>
      </div>
    )
  }
}
