import { ButtonHTMLAttributes, forwardRef } from 'react'
import { VariantProps, cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { motion } from 'framer-motion'

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 tracking-wide font-heading uppercase",
    {
        variants: {
            variant: {
                default: "bg-white text-black hover:bg-zinc-200 border border-transparent shadow-sm",
                destructive: "bg-destructive/10 text-destructive-foreground border border-destructive/20 hover:bg-destructive/20",
                outline: "border border-zinc-700 bg-transparent hover:bg-zinc-800 hover:text-white hover:border-zinc-500 transition-all",
                secondary: "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700",
                ghost: "hover:bg-zinc-800 hover:text-white transition-all",
                glass: "bg-zinc-900/50 border border-white/10 text-white hover:bg-zinc-800 hover:border-white/20 backdrop-blur-md transition-all",
                link: "text-white underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-5 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-12 rounded-lg px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { }

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
