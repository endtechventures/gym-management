"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { useGymContext } from "@/lib/gym-context"
import { createPlan } from "@/lib/supabase-queries"
import { useToast } from "@/hooks/use-toast"

interface CreatePlanModalProps {
  open: boolean
  onClose: () => void
  onPlanCreated: () => void
}

export function CreatePlanModal({ open, onClose, onPlanCreated }: CreatePlanModalProps) {
  const { currentSubaccountId } = useGymContext()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    is_active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.price || !formData.duration || !currentSubaccountId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      const planData = {
        subaccount_id: currentSubaccountId,
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        duration: Number.parseInt(formData.duration),
        is_active: formData.is_active,
        metadata: {},
      }

      console.log("Submitting plan data:", planData)

      await createPlan(planData)

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        duration: "",
        is_active: true,
      })

      toast({
        title: "Success",
        description: "Plan created successfully",
      })

      onPlanCreated()
      onClose()
    } catch (error) {
      console.error("Error creating plan:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create plan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Plan</DialogTitle>
          <DialogDescription>Create a new subscription plan for your gym members.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Monthly Premium, Annual Basic"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="99.99"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the plan benefits..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (Days) *</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
              placeholder="30"
              required
            />
            <p className="text-sm text-gray-500">
              Number of days this plan is valid for (e.g., 30 for monthly, 365 for yearly)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active Plan</Label>
              <p className="text-sm text-gray-500">Make this plan available for new members</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <Card className="border-2 border-dashed">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{formData.name || "Plan Name"}</h3>
                    <p className="text-sm text-gray-600">{formData.description || "Plan description"}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">${formData.price || "0"}</div>
                    <div className="text-sm text-gray-500">{formData.duration || "0"} days</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
