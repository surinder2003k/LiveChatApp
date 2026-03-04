"use client";

import * as React from "react";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function VoiceRecorder({ onSend, onCancel }: { onSend: (blob: Blob, duration: number) => void, onCancel: () => void }) {
    const [isRecording, setIsRecording] = React.useState(false);
    const [duration, setDuration] = React.useState(0);
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const chunksRef = React.useRef<Blob[]>([]);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
                if (chunksRef.current.length > 0) {
                    onSend(audioBlob, duration);
                }
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
            setDuration(0);
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Mic access error:", err);
            onCancel();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            chunksRef.current = []; // Clear chunks so it doesn't trigger onSend
        }
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        onCancel();
    };

    React.useEffect(() => {
        startRecording();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-3 bg-zinc-900 border border-indigo-500/30 rounded-full px-4 py-2 w-full animate-in slide-in-from-bottom-2">
            <div className="relative flex items-center gap-2 flex-1">
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="h-2.5 w-2.5 rounded-full bg-red-500"
                />
                <span className="text-sm font-mono text-zinc-300">{formatTime(duration)}</span>
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 60, ease: "linear" }}
                        className="h-full bg-indigo-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={cancelRecording}
                    className="h-8 w-8 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-400/10"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                    size="icon"
                    onClick={stopRecording}
                    className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                >
                    <Send className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
