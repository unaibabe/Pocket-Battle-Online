import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

const SLOT_DIALOG = "dialog";
const SLOT_DIALOG_TRIGGER = "dialog-trigger";
const SLOT_DIALOG_PORTAL = "dialog-portal";
const SLOT_DIALOG_CLOSE = "dialog-close";
const SLOT_DIALOG_OVERLAY = "dialog-overlay";
const SLOT_DIALOG_CONTENT = "dialog-content";
const SLOT_DIALOG_HEADER = "dialog-header";
const SLOT_DIALOG_FOOTER = "dialog-footer";
const SLOT_DIALOG_TITLE = "dialog-title";
const SLOT_DIALOG_DESCRIPTION = "dialog-description";
const SR_ONLY_CLOSE = "Close";

function Dialog({ ...props }) {
  return <DialogPrimitive.Root data-slot={SLOT_DIALOG} {...props} />
}

function DialogTrigger({ ...props }) {
  return <DialogPrimitive.Trigger data-slot={SLOT_DIALOG_TRIGGER} {...props} />
}

function DialogPortal({ ...props }) {
  return <DialogPrimitive.Portal data-slot={SLOT_DIALOG_PORTAL} {...props} />
}

function DialogClose({ ...props }) {
  return <DialogPrimitive.Close data-slot={SLOT_DIALOG_CLOSE} {...props} />
}

function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      data-slot={SLOT_DIALOG_OVERLAY}
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}) {
  return (
    <DialogPortal data-slot={SLOT_DIALOG_PORTAL}>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot={SLOT_DIALOG_CONTENT}
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot={SLOT_DIALOG_CLOSE}
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">{SR_ONLY_CLOSE}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }) {
  return (
    <div
      data-slot={SLOT_DIALOG_HEADER}
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }) {
  return (
    <div
      data-slot={SLOT_DIALOG_FOOTER}
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      data-slot={SLOT_DIALOG_TITLE}
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      data-slot={SLOT_DIALOG_DESCRIPTION}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}