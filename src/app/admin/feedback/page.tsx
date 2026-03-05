'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bug, Lightbulb, MessageSquare, User, Mail, Calendar } from 'lucide-react'

type FeedbackCategory = 'bug' | 'feature' | 'other'

interface FeedbackRow {
  id: string
  created_at: string
  category: FeedbackCategory
  message: string
  user_id: string | null
  email: string | null
  profiles: { name: string; avatar: string | null } | null
}

const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string; icon: React.ElementType; className: string }> = {
  bug:     { label: 'Bug',     icon: Bug,            className: 'bg-red-100 text-red-800 border-red-200' },
  feature: { label: 'Feature', icon: Lightbulb,      className: 'bg-blue-100 text-blue-800 border-blue-200' },
  other:   { label: 'Feedback', icon: MessageSquare, className: 'bg-gray-100 text-gray-800 border-gray-200' },
}

const FILTER_TABS: { value: FeedbackCategory | 'all'; label: string }[] = [
  { value: 'all',     label: 'All' },
  { value: 'bug',     label: 'Bugs' },
  { value: 'feature', label: 'Features' },
  { value: 'other',   label: 'Feedback' },
]

async function fetchFeedback(): Promise<FeedbackRow[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*, profiles(name, avatar)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as FeedbackRow[]
}

function FeedbackCard({ item }: { item: FeedbackRow }) {
  const config = CATEGORY_CONFIG[item.category]
  const Icon = config.icon
  const submitter = item.profiles?.name ?? item.email ?? 'Guest'
  const isGuest = !item.profiles

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="outline" className={`flex items-center gap-1 text-xs ${config.className}`}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
            <Calendar className="h-3 w-3" />
            {new Date(item.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </div>

        <p className="text-sm leading-relaxed">{item.message}</p>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isGuest ? <Mail className="h-3 w-3" /> : <User className="h-3 w-3" />}
          <span>{submitter}</span>
          {isGuest && <span className="italic">(guest)</span>}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminFeedbackPage() {
  const [activeFilter, setActiveFilter] = useState<FeedbackCategory | 'all'>('all')

  const { data: feedback, isLoading, error } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: fetchFeedback,
    refetchInterval: 60000,
  })

  const counts = {
    all:     feedback?.length ?? 0,
    bug:     feedback?.filter(f => f.category === 'bug').length ?? 0,
    feature: feedback?.filter(f => f.category === 'feature').length ?? 0,
    other:   feedback?.filter(f => f.category === 'other').length ?? 0,
  }

  const filtered = activeFilter === 'all'
    ? feedback ?? []
    : (feedback ?? []).filter(f => f.category === activeFilter)

  return (
    <div className="container px-4 py-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Feedback</h1>
        <p className="text-muted-foreground mt-1">Messages sent by users and guests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',    count: counts.all,     icon: MessageSquare, color: 'text-foreground' },
          { label: 'Bugs',     count: counts.bug,     icon: Bug,           color: 'text-red-600' },
          { label: 'Features', count: counts.feature, icon: Lightbulb,     color: 'text-blue-600' },
          { label: 'General',  count: counts.other,   icon: MessageSquare, color: 'text-gray-500' },
        ].map(({ label, count, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {FILTER_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeFilter === value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
              {value === 'all' ? counts.all : counts[value as FeedbackCategory]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-4"><div className="h-16 animate-pulse bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive py-4">Failed to load feedback.</p>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">No feedback yet.</p>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(item => (
            <FeedbackCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
