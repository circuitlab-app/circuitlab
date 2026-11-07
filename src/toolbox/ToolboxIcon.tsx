import { motion, type Variants } from 'motion/react'
import { IconWrapper, getVariants, useAnimateIconContext, type IconProps } from '@animate-ui/react/icons'

/* A toolbox whose handle lifts and lid hops, matching the other animated top-bar icons. */

type ToolboxIconProps = IconProps<keyof typeof animations>

const animations = {
  default: {
    box: {
      initial: { y: 0, rotate: 0 },
      animate: {
        y: [0, -1.2, 0, -0.4, 0],
        rotate: [0, -5, 4, -2, 0],
        transition: { duration: 0.7, ease: 'easeInOut' },
      },
    },
    handle: {
      initial: { y: 0 },
      animate: { y: [0, -1.6, 0], transition: { duration: 0.45, ease: 'easeOut' } },
    },
  } satisfies Record<string, Variants>,
} as const

function IconComponent({ size, ...props }: ToolboxIconProps) {
  const { controls } = useAnimateIconContext()
  const variants = getVariants(animations)
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <motion.g variants={variants.box} initial="initial" animate={controls} style={{ originX: '50%', originY: '100%' }}>
        <motion.path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" variants={variants.handle} initial="initial" animate={controls} />
        <path d="M17 6a2 2 0 0 1 1.414.586l3 3A2 2 0 0 1 22 11v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 .586-1.414l3-3A2 2 0 0 1 7 6z" />
        <path d="M2 14h20" />
        <path d="M8 12v4M16 12v4" />
      </motion.g>
    </motion.svg>
  )
}

export function ToolboxIcon(props: ToolboxIconProps) {
  return <IconWrapper icon={IconComponent} {...props} />
}
