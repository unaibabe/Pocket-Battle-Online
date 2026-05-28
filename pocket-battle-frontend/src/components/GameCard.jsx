import * as React from "react";
import { cn } from "../lib/utils"; 


const SLOT_CARD = "card";
const SLOT_CARD_HEADER = "card-header";
const SLOT_CARD_TITLE = "card-title";
const SLOT_CARD_DESCRIPTION = "card-description";
const SLOT_CARD_ACTION = "card-action";
const SLOT_CARD_CONTENT = "card-content";
const SLOT_CARD_FOOTER = "card-footer";


function Card({ className, ...props }) {
  return (
    <div
      data-slot={SLOT_CARD}
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot={SLOT_CARD_HEADER}
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }) {
  return (
    <div
      data-slot={SLOT_CARD_TITLE}
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <div
      data-slot={SLOT_CARD_DESCRIPTION}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }) {
  return (
    <div
      data-slot={SLOT_CARD_ACTION}
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return (
    <div data-slot={SLOT_CARD_CONTENT} className={cn("px-6", className)} {...props} />
  );
}

function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot={SLOT_CARD_FOOTER}
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}


export function GameCard({
  title,
  headerAction,
  children,
  className,
  contentClassName,
}) {
  return (
    <Card className={cn("h-full bg-card/50 backdrop-blur-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {headerAction}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};