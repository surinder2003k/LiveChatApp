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
        <div className="flex items-center gap-2 bg-transparent w-full animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex-1 flex items-center gap-3 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[24px] px-4 py-2 shadow-inner h-[44px]">
                <div className="flex items-center gap-2 px-2 py-0.5 bg-red-500/10 rounded-full border border-red-500/20">
                    <motion.div
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                        className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                    />
                    <span className="text-[10px] font-bold font-mono text-red-500 tabular-nums">{formatTime(duration)}</span>
                </div>

                <div className="flex-1 flex items-center gap-0.5 h-4 px-1">
                    {[...Array(16)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                height: isRecording ? [4, 10 + Math.random() * 8, 4] : 4
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 0.5 + Math.random() * 0.5,
                                delay: i * 0.03
                            }}
                            className="w-0.5 bg-zinc-500/40 rounded-full"
                        />
                    ))}
                </div>

                <Button
                    size="icon"
                    variant="ghost"
                    onClick={cancelRecording}
                    className="h-8 w-8 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Cancel"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <Button
                size="icon"
                onClick={stopRecording}
                className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                title="Send Voice Message"
            >
                <Send className="h-5.5 w-5.5" />
            </Button>
        </div>
    );
}
