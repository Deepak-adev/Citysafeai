"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const incidentTypes = [
  "Theft",
  "Vandalism",
  "Suspicious Activity",
  "Traffic Incident",
  "Violence",
  "Drug Activity",
  "Public Disturbance",
  "Other"
]

const severityLevels = [
  "Low",
  "Medium",
  "High",
  "Critical"
]

interface FileUpload {
  file: File
  preview?: string
  type: 'photo' | 'video' | 'document'
}

interface IncidentReportFormProps {
  onClose?: () => void;
}

export function IncidentReportForm({ onClose }: IncidentReportFormProps) {
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    location: "",
    severity: "Low"
  })
  const [uploads, setUploads] = useState<FileUpload[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newUploads: FileUpload[] = []
    setIsSubmitting(true) // Show loading state while processing files

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`)
          continue
        }

        const fileType = file.type.startsWith('image/')
          ? 'photo'
          : file.type.startsWith('video/')
          ? 'video'
          : 'document'

        const upload: FileUpload = {
          file,
          type: fileType
        }

        if (fileType === 'photo' || fileType === 'video') {
          upload.preview = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(file)
          })
        }

        newUploads.push(upload)
      }

      setUploads(current => [...current, ...newUploads])
    } catch (error) {
      console.error('Error processing files:', error)
      alert('Error processing files. Please try again.')
    } finally {
      setIsSubmitting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeUpload = (index: number) => {
    setUploads(uploads.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create a new report object
      const report = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: "pending",
        reportedBy: localStorage.getItem("username") || "Anonymous",
        ...formData,
        attachments: uploads.map(u => ({
          name: u.file.name,
          type: u.type,
          size: u.file.size,
          preview: u.preview
        }))
      }

      // Get existing reports
      const existingReports = JSON.parse(localStorage.getItem("publicReports") || "[]")
      
      // Add new report
      const updatedReports = [report, ...existingReports]
      
      // Save to localStorage
      localStorage.setItem("publicReports", JSON.stringify(updatedReports))

      // Clear form
      setFormData({
        type: "",
        description: "",
        location: "",
        severity: "Low"
      })
      setUploads([])
      
      // Close the dialog
      if (onClose) {
        setTimeout(() => {
          onClose()
        }, 1000) // Give time to show the "Submitted" message
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      alert("Error submitting report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Incident Type</Label>
        <select
          id="type"
          className="w-full p-2 bg-background border rounded-md"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          required
        >
          <option value="">Select type</option>
          {incidentTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          className="w-full min-h-[100px] p-2 border rounded-md bg-background"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          placeholder="Provide details about the incident..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          type="text"
          placeholder="Enter incident location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
          className="bg-transparent"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="severity">Severity</Label>
        <select
          id="severity"
          className="w-full p-2 bg-background border rounded-md"
          value={formData.severity}
          onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
          required
        >
          {severityLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file-upload">Attachments</Label>
        <div className="mt-1 space-y-2">
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            📎 Add Photos, Videos, or Documents
          </Button>

          {uploads.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {uploads.map((upload, index) => (
                <div
                  key={index}
                  className="relative group border rounded-md p-2"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">
                      {upload.type === 'photo' ? '📷' : upload.type === 'video' ? '🎥' : '📄'}
                    </span>
                    <span className="text-sm truncate">{upload.file.name}</span>
                  </div>
                  {upload.preview && (upload.type === 'photo' || upload.type === 'video') && (
                    <div className="mt-1 h-24 bg-gray-100 rounded overflow-hidden">
                      {upload.type === 'photo' ? (
                        <img
                          src={upload.preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={upload.preview}
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                          controlsList="nodownload"
                          playsInline
                        />
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeUpload(index)}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={isSubmitting}
          variant={isSubmitting ? "secondary" : "default"}
        >
          {isSubmitting ? "Report Submitted! ✅" : "Submit Report"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
