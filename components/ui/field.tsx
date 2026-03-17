import * as React from "react"

import { cn } from "@/lib/utils"

type FieldProps = React.HTMLAttributes<HTMLDivElement>

function Field({ className, ...props }: FieldProps) {
  return (
    <div
      data-slot="field"
      className={cn("grid gap-2 text-sm text-foreground", className)}
      {...props}
    />
  )
}

type FieldGroupProps = React.HTMLAttributes<HTMLDivElement>

function FieldGroup({ className, ...props }: FieldGroupProps) {
  return (
    <div
      data-slot="field-group"
      className={cn("grid gap-6 rounded-2xl border bg-card p-6 shadow-sm", className)}
      {...props}
    />
  )
}

interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

function FieldLabel({ className, ...props }: FieldLabelProps) {
  return (
    <label
      data-slot="field-label"
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  )
}

type FieldDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

type FieldSeparatorProps = React.HTMLAttributes<HTMLDivElement>

function FieldSeparator({ className, ...props }: FieldSeparatorProps) {
  return (
    <div
      data-slot="field-separator"
      className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator }

