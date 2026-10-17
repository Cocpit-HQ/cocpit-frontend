"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Mic, Video, Users } from "lucide-react"

interface ShortlistConfigModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (config: { screening: { required: boolean, type: "voice" | "video", question: string } | null }) => void
    applicantName: string
}

export function ShortlistConfigModal({ open, onOpenChange, onConfirm, applicantName }: ShortlistConfigModalProps) {
    const [taskRequired, setTaskRequired] = useState("no")
    const [taskType, setTaskType] = useState<"voice" | "video">("voice")
    const [question, setQuestion] = useState("")

    const handleConfirm = () => {
        if (taskRequired === "no") {
            onConfirm({ screening: null })
        } else {
            onConfirm({
                screening: {
                    required: true,
                    type: taskType,
                    question: question || "Please introduce yourself."
                }
            })
        }
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Shortlist {applicantName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label className="text-base">Do you want to add a communication round?</Label>
                        <RadioGroup value={taskRequired} onValueChange={setTaskRequired} className="flex gap-4">
                            <div className="flex items-center space-x-2 border border-border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors flex-1">
                                <RadioGroupItem value="no" id="no-task" />
                                <Label htmlFor="no-task" className="cursor-pointer flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    Direct Shortlist
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 border border-border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors flex-1">
                                <RadioGroupItem value="yes" id="yes-task" />
                                <Label htmlFor="yes-task" className="cursor-pointer flex items-center gap-2">
                                    <Mic className="w-4 h-4 text-muted-foreground" />
                                    Add Task
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {taskRequired === "yes" && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-3">
                                <Label>Task Type</Label>
                                <RadioGroup value={taskType} onValueChange={(v) => setTaskType(v as "voice" | "video")} className="grid grid-cols-2 gap-4">
                                    <div className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-all ${taskType === 'voice' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                        <RadioGroupItem value="voice" id="voice" />
                                        <Label htmlFor="voice" className="cursor-pointer flex items-center gap-2">
                                            <Mic className="w-4 h-4" />
                                            Voice Note
                                        </Label>
                                    </div>
                                    <div className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-all ${taskType === 'video' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                        <RadioGroupItem value="video" id="video" />
                                        <Label htmlFor="video" className="cursor-pointer flex items-center gap-2">
                                            <Video className="w-4 h-4" />
                                            Video Intro
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="question">Task Instruction / Question</Label>
                                <Textarea
                                    id="question"
                                    placeholder="e.g. Tell us about your most challenging project..."
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleConfirm}>Confirm Shortlist</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
