"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Trash2, Play, CircleStop, RefreshCcw } from "lucide-react"

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void
    onDelete: () => void
}

export function AudioRecorder({ onRecordingComplete, onDelete }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [recordingTime, setRecordingTime] = useState(0)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (audioUrl) URL.revokeObjectURL(audioUrl)
        }
    }, [])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaRecorderRef.current = new MediaRecorder(stream)
            chunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" })
                const url = URL.createObjectURL(blob)
                setAudioUrl(url)
                onRecordingComplete(blob)

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)

            // Timer
            setRecordingTime(0)
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 60) { // Max 60 seconds
                        stopRecording()
                        return prev
                    }
                    return prev + 1
                })
            }, 1000)

        } catch (err) {
            console.error("Error accessing microphone:", err)
            alert("Could not access microphone. Please allow permissions.")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const handleDelete = () => {
        setAudioUrl(null)
        chunksRef.current = []
        setRecordingTime(0)
        onDelete()
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4 bg-muted/20">

            {!audioUrl && !isRecording && (
                <div className="flex flex-col items-center justify-center gap-2 py-2">
                    <button
                        type="button"
                        onClick={startRecording}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors font-medium"
                    >
                        <Mic className="w-5 h-5" />
                        Record Pitch
                    </button>
                    <span className="text-xs text-muted-foreground">Max 60 seconds</span>
                </div>
            )}

            {isRecording && (
                <div className="flex items-center justify-between animate-pulse px-2">
                    <div className="flex items-center gap-2 text-red-500 font-medium">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        Recording... {formatTime(recordingTime)}
                    </div>
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        title="Stop Recording"
                    >
                        <Square className="w-5 h-5 fill-foreground text-foreground" />
                    </button>
                </div>
            )}

            {audioUrl && (
                <div className="flex items-center gap-3">
                    <audio src={audioUrl} controls className="h-8 flex-1 w-full" />
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
                        title="Delete & Retake"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
