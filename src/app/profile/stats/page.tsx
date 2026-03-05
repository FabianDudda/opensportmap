'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { MatchService } from '@/lib/elo/match-service'
import { EloRatings } from '@/lib/supabase/types'
import { TrendingUp, Target, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import SignInForm from '@/components/auth/sign-in-form'

const SPORTS = ['tennis', 'basketball', 'volleyball', 'spikeball', 'badminton', 'squash'] as const

export default function StatsPage() {
  const { user, profile, loading } = useAuth()

  const { data: allStats = {} } = useQuery({
    queryKey: ['user-stats-all', user?.id],
    queryFn: async () => {
      if (!user) return {}
      const stats: Record<string, any> = {}
      const promises = SPORTS.map(async (sport) => {
        const sportStats = await MatchService.getPlayerMatchStats(user.id, sport)
        return [sport, sportStats]
      })
      const results = await Promise.all(promises)
      results.forEach(([sport, sportStats]) => {
        stats[sport as string] = sportStats
      })
      return stats
    },
    enabled: !!user,
  })

  const { data: overallStats } = useQuery({
    queryKey: ['user-stats-overall', user?.id],
    queryFn: () => user ? MatchService.getPlayerMatchStats(user.id) : null,
    enabled: !!user,
  })

  if (loading) {
    return (
      <div className="container px-4 py-8">
        <div className="max-w-xl mx-auto space-y-6">
          <Card><CardContent className="p-6"><div className="h-24 animate-pulse bg-muted rounded" /></CardContent></Card>
          <Card><CardContent className="p-6"><div className="h-20 animate-pulse bg-muted rounded" /></CardContent></Card>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="container px-4 py-12 max-w-xl mx-auto">
        <SignInForm />
      </div>
    )
  }

  const eloRatings = profile.elo as unknown as EloRatings
  const highestElo = Object.entries(eloRatings).reduce(
    (max, [sport, rating]) => rating > max.rating ? { sport, rating } : max,
    { sport: '', rating: 0 }
  )
  const bestSport = highestElo.rating > 1500 ? highestElo : null

  return (
    <div className="container px-4 py-8 overflow-x-hidden">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Best Sport Badge */}
        {bestSport && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Best: {bestSport.sport} ({Math.round(bestSport.rating)})
            </Badge>
          </div>
        )}

        {/* Overall Statistics */}
        {overallStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Overall Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{overallStats.totalMatches}</div>
                  <div className="text-sm text-muted-foreground">Total Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{overallStats.wins}</div>
                  <div className="text-sm text-muted-foreground">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{overallStats.losses}</div>
                  <div className="text-sm text-muted-foreground">Losses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {overallStats.totalMatches > 0 ? `${Math.round(overallStats.winRate * 100)}%` : '0%'}
                  </div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Elo Ratings by Sport */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Elo Ratings by Sport
            </CardTitle>
            <CardDescription>
              Your current skill ratings across different sports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SPORTS.map((sport) => {
                const elo = (profile.elo as unknown as EloRatings)[sport]
                const stats = allStats[sport]

                return (
                  <Card key={sport} className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold capitalize">{sport}</h3>
                        <div className="text-right">
                          <div className="text-xl font-bold">{Math.round(elo)}</div>
                          <div className="text-xs text-muted-foreground">Rating</div>
                        </div>
                      </div>

                      {stats && stats.totalMatches > 0 && (
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-sm">
                            <span>Matches:</span>
                            <span>{stats.totalMatches}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Win Rate:</span>
                            <span>{Math.round(stats.winRate * 100)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Avg Change:</span>
                            <span className={stats.averageEloChange > 0 ? 'text-green-600' : 'text-red-600'}>
                              {stats.averageEloChange > 0 ? '+' : ''}{Math.round(stats.averageEloChange)}
                            </span>
                          </div>
                        </div>
                      )}

                      {(!stats || stats.totalMatches === 0) && (
                        <div className="text-xs text-muted-foreground">
                          No matches played yet
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
