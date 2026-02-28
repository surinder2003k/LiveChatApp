"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    variant = "default",
    confirmText = "Confirm",
    cancelText = "Cancel",
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] glass border-primary/20 shadow-2xl">
                <DialogHeader className="flex flex-col items-center gap-3 text-center sm:text-left sm:flex-row sm:items-start">
                    <div className={`rounded-full p-3 shrink-0 ${variant === "destructive" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}>
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                        <DialogDescription className="text-muted-foreground pt-1">
                            {description}
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <DialogFooter className="flex flex-row gap-3 mt-6">
                    <Button
                        variant="ghost"
                        className="flex-1 font-semibold"
                        onClick={() => onOpenChange(false)}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        className={`flex-1 font-bold shadow-lg ${variant === "destructive" ? "bg-red-600 hover:bg-red-700 font-bold" : "bg-primary hover:bg-primary/90"}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
