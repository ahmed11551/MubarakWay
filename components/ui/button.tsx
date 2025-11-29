"use client"

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 shadow-lg shadow-destructive/25',
        outline:
          'border-2 bg-background shadow-sm hover:bg-accent/10 hover:text-accent-foreground hover:border-primary/50 dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md',
        ghost:
          'hover:bg-accent/20 hover:text-accent-foreground dark:hover:bg-accent/30',
        link: 'text-primary underline-offset-4 hover:underline',
        // Новые градиентные варианты
        gradient:
          'bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40',
        'gradient-warm':
          'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90 shadow-lg shadow-orange-500/30 hover:shadow-xl',
        'gradient-cool':
          'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/30 hover:shadow-xl',
        'gradient-purple':
          'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/30 hover:shadow-xl',
        'gradient-gold':
          'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90 shadow-lg shadow-amber-500/30 hover:shadow-xl',
        // Стеклянный эффект
        glass:
          'bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10',
        // Мягкие цветные кнопки
        'soft-primary':
          'bg-primary/15 text-primary hover:bg-primary/25 dark:bg-primary/20 dark:hover:bg-primary/30',
        'soft-accent':
          'bg-accent/15 text-accent hover:bg-accent/25 dark:bg-accent/20 dark:hover:bg-accent/30',
      },
      size: {
        default: 'h-10 px-5 py-2.5 has-[>svg]:px-4',
        sm: 'h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-12 rounded-xl px-8 has-[>svg]:px-5 text-base',
        xl: 'h-14 rounded-2xl px-10 has-[>svg]:px-6 text-lg',
        icon: 'size-10 rounded-xl',
        'icon-sm': 'size-8 rounded-lg',
        'icon-lg': 'size-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  onTouchEnd,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  // Fix for button sticking on touch devices
  const handleTouchEnd = React.useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    // Call original handler if provided
    onTouchEnd?.(e)
    
    // Force reset transform to prevent sticking
    // Works for both regular buttons and asChild (Slot) components
    const target = e.currentTarget as HTMLElement
    if (target) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        // Reset transform to prevent sticking
        target.style.transform = 'scale(1)'
        // Also remove any lingering active state classes if needed
        target.classList.remove('active')
      })
    }
  }, [onTouchEnd])

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      onTouchEnd={handleTouchEnd}
      {...props}
    />
  )
}

export { Button, buttonVariants }
