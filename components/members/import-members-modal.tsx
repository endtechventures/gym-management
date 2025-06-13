"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useGymContext } from "@/lib/gym-context"
import { Upload, FileText, CheckCircle, XCircle, Download, Loader2, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase-queries"
import { getCurrentUser } from "@/lib/supabase-queries"

interface ImportMembersModalProps {
  open: boolean
  onClose: () => void
  onImportCompleted: () => void
}

interface ColumnMapping {
  [key: string]: string
}

interface PreviewData {
  headers: string[]
  rows: any[][]
  allRows: any[][] // Store all rows for processing
}

interface ImportJob {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  total_rows: number
  processed_rows: number
  success_count: number
  error_count: number
  logs: string[]
  created_at: string
  completed_at?: string
  file_name?: string
}

const REQUIRED_FIELDS = ["name"]
const OPTIONAL_FIELDS = ["email", "phone", "gender", "dob", "join_date", "is_active", "notes"]
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === "production"

export function ImportMembersModal({ open, onClose, onImportCompleted }: ImportMembersModalProps) {
  const { currentSubaccountId } = useGymContext()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [step, setStep] = useState<"upload" | "preview" | "mapping" | "importing">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [importJob, setImportJob] = useState<ImportJob | null>(null)

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // Poll for import job status updates
  useEffect(() => {
    if (importJob?.id && importJob.status !== "completed" && importJob.status !== "failed") {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const { data, error } = await supabase.from("member_imports").select("*").eq("id", importJob.id).single()

          if (error) {
            console.error("Error polling import job:", error)
            return
          }

          if (data) {
            setImportJob({
              id: data.id,
              status: data.status,
              total_rows: data.total_rows || 0,
              processed_rows: data.processed_rows || 0,
              success_count: data.success_count || 0,
              error_count: data.error_count || 0,
              logs: data.logs || [],
              created_at: data.created_at,
              completed_at: data.completed_at,
              file_name: data.file_name,
            })

            // If the job is complete, stop polling and notify
            if (data.status === "completed" || data.status === "failed") {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
              }

              if (data.status === "completed") {
                toast({
                  title: "Import completed",
                  description: `Successfully imported ${data.success_count} members. ${data.error_count} errors.`,
                })
                onImportCompleted()
              } else if (data.status === "failed") {
                toast({
                  title: "Import failed",
                  description: "Please check the logs for details",
                  variant: "destructive",
                })
              }
            }
          }
        } catch (error) {
          console.error("Error polling import job:", error)
        }
      }, 2000) // Poll every 2 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [importJob?.id, importJob?.status, onImportCompleted, toast])

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile) return

      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase()
      if (!["csv"].includes(fileExtension || "")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        })
        return
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
      setIsProcessing(true)

      try {
        // Parse file for preview
        const text = await selectedFile.text()
        const lines = text.split("\n").filter((line) => line.trim())

        if (lines.length < 2) {
          toast({
            title: "Invalid file",
            description: "File must contain at least a header row and one data row",
            variant: "destructive",
          })
          return
        }

        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
        const allRows = []
        const previewRows = []

        // Parse all rows
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
          allRows.push(values)

          // Only add first 10 rows to preview
          if (i <= 10) {
            previewRows.push(values)
          }
        }

        setPreviewData({ headers, rows: previewRows, allRows })

        // Auto-map columns based on common names
        const autoMapping: ColumnMapping = {}
        headers.forEach((header, index) => {
          const lowerHeader = header.toLowerCase().trim()
          if (lowerHeader.includes("name") || lowerHeader === "member name" || lowerHeader === "full name") {
            autoMapping[index.toString()] = "name"
          } else if (lowerHeader.includes("email")) {
            autoMapping[index.toString()] = "email"
          } else if (lowerHeader.includes("phone") || lowerHeader.includes("mobile")) {
            autoMapping[index.toString()] = "phone"
          } else if (lowerHeader.includes("gender") || lowerHeader.includes("sex")) {
            autoMapping[index.toString()] = "gender"
          } else if (lowerHeader.includes("birth") || lowerHeader.includes("dob")) {
            autoMapping[index.toString()] = "dob"
          } else if (lowerHeader.includes("join") || lowerHeader.includes("start")) {
            autoMapping[index.toString()] = "join_date"
          } else if (lowerHeader.includes("active") || lowerHeader.includes("status")) {
            autoMapping[index.toString()] = "is_active"
          } else if (lowerHeader.includes("note") || lowerHeader.includes("comment")) {
            autoMapping[index.toString()] = "notes"
          }
        })

        setColumnMapping(autoMapping)
        setStep("preview")
      } catch (error) {
        console.error("Error parsing file:", error)
        toast({
          title: "Error parsing file",
          description: "Please check your file format and try again",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [toast],
  )

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const droppedFile = event.dataTransfer.files[0]
      if (droppedFile) {
        handleFileSelect(droppedFile)
      }
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const validateMapping = () => {
    const mappedFields = Object.values(columnMapping)
    const hasRequiredFields = REQUIRED_FIELDS.every((field) => mappedFields.includes(field))

    if (!hasRequiredFields) {
      toast({
        title: "Missing required fields",
        description: "Please map the 'name' field",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  // Helper function to create a member import record in the database
  const createMemberImport = async (data: any) => {
    try {
      console.log("Creating member import with data:", data)
      const { data: result, error } = await supabase.from("member_imports").insert(data).select().single()

      if (error) {
        console.error("Error creating member import:", error)
        throw new Error(`Failed to create import record: ${error.message}`)
      }

      console.log("Member import created successfully:", result)
      return result
    } catch (error) {
      console.error("Error in createMemberImport:", error)
      throw error
    }
  }

  // Process the import data directly in the frontend as a fallback
  const processImportDataLocally = async (
    importId: string,
    allRows: any[][],
    headers: string[],
    mapping: ColumnMapping,
    subaccountId: string,
  ) => {
    try {
      console.log("Starting local processing...")
      // Update status to processing
      await supabase.from("member_imports").update({ status: "processing" }).eq("id", importId)

      const totalRows = allRows.length
      let processedRows = 0
      let successCount = 0
      let errorCount = 0
      const logs: string[] = []

      // Process rows in batches
      const batchSize = 5
      for (let i = 0; i < totalRows; i += batchSize) {
        const endIndex = Math.min(i + batchSize, totalRows)
        const batch = allRows.slice(i, endIndex)

        for (let j = 0; j < batch.length; j++) {
          const rowIndex = i + j
          const row = batch[j]

          try {
            const memberData: any = {
              subaccount_id: subaccountId,
              is_active: true, // Default value
              join_date: new Date().toISOString().split("T")[0], // Default to today
            }

            // Map the row data to member fields
            Object.entries(mapping).forEach(([columnIndex, fieldName]) => {
              if (fieldName && fieldName !== "skip") {
                const value = row[Number.parseInt(columnIndex)]
                if (value && value.trim()) {
                  if (fieldName === "is_active") {
                    // Convert various formats to boolean
                    const lowerValue = value.toLowerCase().trim()
                    memberData[fieldName] =
                      lowerValue === "true" || lowerValue === "1" || lowerValue === "yes" || lowerValue === "active"
                  } else if (fieldName === "dob" || fieldName === "join_date") {
                    // Handle date fields
                    try {
                      const date = new Date(value)
                      if (!isNaN(date.getTime())) {
                        memberData[fieldName] = date.toISOString().split("T")[0]
                      }
                    } catch (e) {
                      // Invalid date, skip
                    }
                  } else {
                    memberData[fieldName] = value.trim()
                  }
                }
              }
            })

            // Validate required fields
            if (!memberData.name || memberData.name.trim() === "") {
              throw new Error("Name is required")
            }

            // Create the member
            const { data, error } = await supabase.from("members").insert(memberData).select().single()
            if (error) throw error

            successCount++
            logs.push(`Row ${rowIndex + 1}: Member imported successfully`)
          } catch (error) {
            errorCount++
            logs.push(`Row ${rowIndex + 1}: ${error instanceof Error ? error.message : "Unknown error"}`)
          }
        }

        processedRows = endIndex

        // Update progress
        await supabase
          .from("member_imports")
          .update({
            processed_rows: processedRows,
            success_count: successCount,
            error_count: errorCount,
            logs: logs,
          })
          .eq("id", importId)

        // Add a small delay to prevent overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Mark as completed
      await supabase
        .from("member_imports")
        .update({
          status: "completed",
          processed_rows: processedRows,
          success_count: successCount,
          error_count: errorCount,
          logs: logs,
          completed_at: new Date().toISOString(),
        })
        .eq("id", importId)

      console.log("Local processing completed successfully")
    } catch (error) {
      console.error("Error in local processing:", error)
      await supabase
        .from("member_imports")
        .update({
          status: "failed",
          logs: ["Processing failed due to an internal error"],
          completed_at: new Date().toISOString(),
        })
        .eq("id", importId)
    }
  }

  // Call the Edge Function to process the import
  const callEdgeFunction = async (importId: string) => {
    try {
      console.log("Calling Edge Function to process import...")
      const session = await supabase.auth.getSession()
      const accessToken = session.data.session?.access_token

      if (!accessToken) {
        throw new Error("No access token available")
      }

      // Get the Supabase URL from the environment
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

      if (!supabaseUrl) {
        throw new Error("Supabase URL not available")
      }

      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/process-member-import`
      console.log("Edge Function URL:", edgeFunctionUrl)

      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          importId: importId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Edge function error response:", response.status, errorData)
        throw new Error(`Edge function returned status ${response.status}`)
      }

      const responseData = await response.json()
      console.log("Edge function response:", responseData)
      return true
    } catch (error) {
      console.error("Edge function error:", error)
      throw error
    }
  }

  const startImport = async () => {
    if (!file || !currentSubaccountId || !validateMapping() || !previewData) return

    setIsProcessing(true)
    setStep("importing")

    try {
      // Get current user
      const user = await getCurrentUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      console.log("Starting import process...")

      // 1. Upload the file to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`
      const filePath = `${fileName}`

      console.log("Uploading file to storage:", filePath)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("member-imports")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      console.log("File uploaded successfully:", uploadData)

      // 2. Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage.from("member-imports").getPublicUrl(filePath)

      const fileUrl = publicUrlData.publicUrl
      console.log("File public URL:", fileUrl)

      // 3. Create an import job record in the database
      const importData = {
        subaccount_id: currentSubaccountId,
        uploaded_by: user.id,
        file_name: file.name,
        file_url: fileUrl,
        status: "pending",
        total_rows: previewData.allRows.length,
        column_mapping: columnMapping,
      }

      console.log("Creating import job with data:", importData)

      const importJobData = await createMemberImport(importData)

      if (!importJobData) {
        throw new Error("Failed to create import job")
      }

      console.log("Import job created:", importJobData)

      // 4. Set the import job in state to start polling
      setImportJob({
        id: importJobData.id,
        status: importJobData.status,
        total_rows: importJobData.total_rows || 0,
        processed_rows: importJobData.processed_rows || 0,
        success_count: importJobData.success_count || 0,
        error_count: importJobData.error_count || 0,
        logs: importJobData.logs || [],
        created_at: importJobData.created_at,
        file_name: file.name,
      })

      // 5. Process the data - use Edge Function in production, local processing in development
      if (isProduction) {
        try {
          // Try to use the Edge Function in production
          await callEdgeFunction(importJobData.id)
          toast({
            title: "Import started",
            description: "Your data is being processed by the Edge Function. You can monitor the progress here.",
          })
        } catch (edgeFunctionError) {
          console.error("Edge function error:", edgeFunctionError)
          toast({
            title: "Edge Function unavailable",
            description: "Falling back to local processing. This might take longer.",
          })
          // Fall back to local processing if the Edge Function fails
          processImportDataLocally(
            importJobData.id,
            previewData.allRows,
            previewData.headers,
            columnMapping,
            currentSubaccountId,
          )
        }
      } else {
        // In development, just use local processing
        toast({
          title: "Import started",
          description: "Your data is being processed locally. You can monitor the progress here.",
        })
        processImportDataLocally(
          importJobData.id,
          previewData.allRows,
          previewData.headers,
          columnMapping,
          currentSubaccountId,
        )
      }
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const resetModal = () => {
    setStep("upload")
    setFile(null)
    setPreviewData(null)
    setColumnMapping({})
    setImportJob(null)
    setIsProcessing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const downloadTemplate = () => {
    const templateContent =
      "name,email,phone,gender,dob,join_date,is_active,notes\nJohn Doe,john@example.com,+1234567890,male,1990-01-15,2024-01-01,true,New member\nJane Smith,jane@example.com,+1234567891,female,1985-05-20,2024-01-02,true,Referred by John"
    const blob = new Blob([templateContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "member_import_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Members
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Upload a CSV file with member data to import in bulk.</p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Drop your CSV file here or click to browse</p>
              <p className="text-sm text-gray-500 mb-4">Supports CSV files up to 10MB</p>
              <Button variant="outline">Choose File</Button>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileInputChange} className="hidden" />
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing file...
              </div>
            )}
          </div>
        )}

        {step === "preview" && previewData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">File Preview</h3>
                <p className="text-sm text-gray-600">
                  Showing first {previewData.rows.length} rows of {previewData.allRows.length} total rows
                </p>
              </div>
              <Badge variant="outline">{file?.name}</Badge>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {previewData.headers.map((header, index) => (
                          <th key={index} className="px-4 py-2 text-left font-medium text-gray-900 border-b">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-2 text-gray-700">
                              {String(cell || "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={() => setStep("mapping")}>
                Next: Map Columns
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === "mapping" && previewData && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Column Mapping</h3>
              <p className="text-sm text-gray-600">
                Map your file columns to member fields. Required fields are marked with *
              </p>
            </div>

            <div className="grid gap-4">
              {previewData.headers.map((header, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="font-medium">{header}</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Sample: {String(previewData.rows[0]?.[index] || "N/A")}
                    </p>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={columnMapping[index.toString()] || ""}
                      onValueChange={(value) => {
                        setColumnMapping((prev) => ({
                          ...prev,
                          [index.toString()]: value,
                        }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Don't import</SelectItem>
                        {ALL_FIELDS.map((field) => (
                          <SelectItem key={field} value={field}>
                            {field === "name" ? "Name *" : field.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("preview")}>
                Back
              </Button>
              <Button onClick={startImport} disabled={!validateMapping() || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Start Import
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && importJob && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium">Importing Members</h3>
              <p className="text-sm text-gray-600">
                {importJob.status === "pending"
                  ? "Starting import process..."
                  : importJob.status === "processing"
                    ? "Processing your data..."
                    : importJob.status === "completed"
                      ? "Import completed successfully!"
                      : "Import failed. Please check the logs."}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importJob.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : importJob.status === "failed" ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  )}
                  Import Status: {importJob.status}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>
                      {importJob.processed_rows} / {importJob.total_rows}
                    </span>
                  </div>
                  <Progress
                    value={importJob.total_rows > 0 ? (importJob.processed_rows / importJob.total_rows) * 100 : 0}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Success: {importJob.success_count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Errors: {importJob.error_count}</span>
                  </div>
                </div>

                {importJob.logs && importJob.logs.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Import Log</Label>
                    <div className="mt-2 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded text-xs">
                      {importJob.logs.map((log, index) => (
                        <div key={index} className="mb-1">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {(importJob.status === "completed" || importJob.status === "failed") && (
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={resetModal}>
                  Import Another File
                </Button>
                <Button onClick={handleClose}>Close</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ImportMembersModal
