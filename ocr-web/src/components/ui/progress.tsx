'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  variant?: 'default' | 'gradient' | 'glow'
  showValue?: boolean
  animated?: boolean
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, variant = 'default', showValue = true, animated = true, ...props }, ref) => {
    const variants = {
      default: 'bg-slate-700',
      gradient: 'bg-transparent',
      glow: 'bg-transparent',
    }

    const indicatorVariants = {
      default: 'bg-cyan-500',
      gradient: 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500',
      glow: 'bg-gradient-to-r from-cyan-400 to-purple-500 shadow-lg shadow-cyan-500/50',
    }

    return (
      <div className={cn('w-full', className)} {...props}>
        <div
          ref={ref}
          className={cn(
            'h-3 w-full overflow-hidden rounded-full',
            variants[variant]
          )}
        >
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out rounded-full',
              indicatorVariants[variant],
              animated && 'animate-pulse'
            )}
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          />
        </div>
        {showValue && (
          <div className="mt-2 flex justify-between text-sm text-slate-400">
            <span>{value}%</span>
          </div>
        )}
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export { Progress }