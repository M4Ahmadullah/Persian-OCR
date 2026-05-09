'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
        secondary: 'bg-slate-700 text-slate-300 border border-slate-600',
        success: 'bg-green-500/20 text-green-400 border border-green-500/30',
        warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        error: 'bg-red-500/20 text-red-400 border border-red-500/30',
        purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
        pink: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
        cyan: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }