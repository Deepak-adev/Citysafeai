import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-6 sm:space-y-8">
        {/* Header Section - Enhanced responsive typography */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-balance leading-tight">
            Crime Prevention System
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground text-pretty max-w-2xl mx-auto px-2">
            Advanced predictive analytics and real-time monitoring for safer communities
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 max-w-2xl mx-auto sm:grid-cols-2">
          <Card className="p-6 sm:p-8 hover:bg-card/80 transition-colors">
            <div className="space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-card-foreground">Police Portal</h2>
              <p className="text-sm sm:text-base text-muted-foreground text-pretty">
                Access advanced analytics, patrol management, and real-time crime monitoring tools
              </p>
              <Link href="/police-login" className="block">
                <Button size="lg" className="w-full">
                  Login as Police
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 sm:p-8 hover:bg-card/80 transition-colors">
            <div className="space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-secondary/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-secondary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-card-foreground">Public Portal</h2>
              <p className="text-sm sm:text-base text-muted-foreground text-pretty">
                View safety information, report incidents, and access community safety resources
              </p>
              <Link href="/public-login" className="block">
                <Button size="lg" variant="secondary" className="w-full">
                  Login as Public
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="pt-6 sm:pt-8 text-xs sm:text-sm text-muted-foreground">
          <p>Powered by advanced AI and real-time data analytics</p>
        </div>
      </div>
    </div>
  )
}
