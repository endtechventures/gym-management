"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  title?: string
  description?: string
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title = "Are you sure?",
  description = "This action cannot be undone.",
}: AlertModalProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button disabled={loading} variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={loading} variant="destructive" onClick={onConfirm}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
