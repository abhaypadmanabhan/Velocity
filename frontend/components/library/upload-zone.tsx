"use client"
import { useCallback, useState } from "react"

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>
  isUploading: boolean
}

export function UploadZone({ onUpload, isUploading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) return
    await onUpload(file)
  }, [onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <label
      className={`block w-full border-2 border-dashed p-12 text-center cursor-pointer transition-colors
        ${isDragging ? "border-primary bg-surface" : "border-muted hover:border-accent-purple"}
        ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
      onDragOver={(e) => { e.preventDefault(); if (!isDragging) setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input type="file" accept=".pdf" className="sr-only" onChange={handleChange} disabled={isUploading} />
      <p className="font-display text-muted text-sm uppercase tracking-widest">
        {isUploading ? "Processing..." : "Drop PDF or click to upload"}
      </p>
    </label>
  )
}
