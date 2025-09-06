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

export function IncidentReportForm() {
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    location: "",
    severity: "Low"
  })
  const [uploads, setUploads] = useState<FileUpload[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newUploads: FileUpload[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileType = file.type.startsWith('image/')
        ? 'photo'
        : file.type.startsWith('video/')
        ? 'video'
        : 'document'

      if (fileType === 'photo' || fileType === 'video') {
        const reader = new FileReader()
        reader.onload = (e) => {
          const upload = newUploads.find(u => u.file === file)
          if (upload && e.target?.result) {
            upload.preview = e.target.result as string
            setUploads([...uploads, ...newUploads])
          }
        }
        reader.readAsDataURL(file)
      }

      newUploads.push({
        file,
        type: fileType
      })
    }

    setUploads([...uploads, ...newUploads])
  }

  const removeUpload = (index: number) => {
    setUploads(uploads.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Here you would typically upload the files and create the incident report
      console.log("Submitting:", {
        ...formData,
        uploads: uploads.map(u => ({
          name: u.file.name,
          type: u.type,
          size: u.file.size
        }))
      })

      // Clear form
      setFormData({
        type: "",
        description: "",
        location: "",
        severity: "Low"
      })
      setUploads([])
    } catch (error) {
      console.error("Error submitting report:", error)
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
          className="w-full p-2 bg-transparent border rounded-md"
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
          className="w-full min-h-[100px] p-2 border rounded-md bg-transparent"
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
          className="w-full p-2 bg-transparent border rounded-md"
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
        <Label>Evidence</Label>
        <div className="space-y-2">
          <input
            ref={fileInputRef}
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
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </Button>
        <Button type="button" variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}
