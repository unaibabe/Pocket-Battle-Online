import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { cn } from '../../lib/utils'

const SLOT_SCROLL_AREA = "scroll-area";
const SLOT_SCROLL_AREA_VIEWPORT = "scroll-area-viewport";
const SLOT_SCROLL_AREA_SCROLLBAR = "scroll-area-scrollbar";
const SLOT_SCROLL_AREA_THUMB = "scroll-area-thumb";

const ORIENTATION_VERTICAL = "vertical";
const ORIENTATION_HORIZONTAL = "horizontal";

function ScrollArea({ className, children, ...props }) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot={SLOT_SCROLL_AREA}
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot={SLOT_SCROLL_AREA_VIEWPORT}
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({ className, orientation = ORIENTATION_VERTICAL, ...props }) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot={SLOT_SCROLL_AREA_SCROLLBAR}
      orientation={orientation}
      className={cn(
        'flex touch-none p-px transition-colors select-none',
        orientation === ORIENTATION_VERTICAL &&
          'h-full w-2.5 border-l border-l-transparent',
        orientation === ORIENTATION_HORIZONTAL &&
          'h-2.5 flex-col border-t border-t-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot={SLOT_SCROLL_AREA_THUMB}
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }