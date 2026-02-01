"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mic, Video, Upload, X, Play, Square, Loader2 } from "lucide-react"
import { toast } from "sonner"
import * as api from "@/services/api/jobs"

interface TaskSubmissionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    applicationId: string
    taskType: "voice" | "video"
    question: string
    onSuccess: () => void
}

export function TaskSubmissionModal({ open, onOpenChange, applicationId, taskType, question, onSuccess }: TaskSubmissionModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)

    const startRecording = async () => {
        try {
            const constraints = taskType === 'video' ? { video: true, audio: true } : { audio: true }
            const stream = await navigator.mediaDevices.getUserMedia(constraints)

            if (taskType === 'video' && videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
            }

            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder

            const chunks: Blob[] = []
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: taskType === 'video' ? 'video/webm' : 'audio/webm' })
                setRecordedChunks(chunks)
                const url = URL.createObjectURL(blob)
                setPreviewUrl(url)
                // Convert blob to file for upload
                const recordedFile = new File([blob], `recording.${taskType === 'video' ? 'webm' : 'webm'}`, { type: blob.type })
                setFile(recordedFile)

                // Stop tracks
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch (err) {
            console.error(err)
            toast.error("Could not access microphone/camera")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0]
            if (selected.size > 50 * 1024 * 1024) { // 50MB
                toast.error("File likely too large (max ~50MB)")
                return
            }
            setFile(selected)
            setPreviewUrl(URL.createObjectURL(selected))
        }
    }

    const clearSelection = () => {
        setFile(null)
        setPreviewUrl(null)
        setRecordedChunks([])
    }

    const handleSubmit = async () => {
        if (!file) {
            toast.error("Please record or select a file")
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            await api.submitTask(applicationId, formData)
            toast.success("Task submitted successfully!")
            onSuccess()
            onOpenChange(false)
        } catch (err) {
            console.error(err)
            toast.error("Failed to submit task")
        } finally {
            setUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Submit {taskType === 'voice' ? 'Voice' : 'Video'} Response</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-muted/30 p-4 rounded-lg border border-border">
                        <h4 className="font-medium text-sm mb-1 text-muted-foreground">Instruction</h4>
                        <p className="text-foreground text-sm leading-relaxed">{question}</p>
                    </div>

                    {!file ? (
                        <div className="flex flex-col gap-4">
                            {!isRecording ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={startRecording}
                                        className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-border rounded-xl hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                            {taskType === 'video' ? <Video className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                        </div>
                                        <span className="text-sm font-medium">Record Now</span>
                                    </button>

                                    <div className="relative flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium">Upload File</span>
                                        <input
                                            type="file"
                                            accept={taskType === 'video' ? "video/*" : "audio/*"}
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 py-8 bg-black/5 rounded-xl border border-border">
                                    {taskType === 'video' && (
                                        <video ref={videoRef} className="w-full max-h-[300px] mb-4 bg-black" muted playsInline />
                                    )}
                                    <div className="animate-pulse flex items-center gap-2 text-red-600 font-medium">
                                        <div className="w-3 h-3 bg-red-600 rounded-full" />
                                        Recording...
                                    </div>
                                    <Button variant="destructive" onClick={stopRecording}>
                                        <Square className="w-4 h-4 mr-2" />
                                        Stop Recording
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative bg-black/5 p-4 rounded-xl border border-border flex flex-col items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 hover:bg-background"
                                    onClick={clearSelection}
                                >
                                    <X className="w-3 h-3" />
                                </Button>

                                {taskType === 'video' ? (
                                    <video src={previewUrl!} controls className="w-full max-h-[300px] rounded-lg bg-black" />
                                ) : (
                                    <audio src={previewUrl!} controls className="w-full mt-2" />
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                    Ready to submit
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!file || uploading}>
                        {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Submit Response
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
