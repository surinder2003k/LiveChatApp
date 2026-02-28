"use client";

import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";

export function IntroLoader() {
    const [isVisible, setIsVisible] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0c]"
                >
                    <div className="relative overflow-hidden px-8 py-4">
                        <motion.div
                            initial={{ y: 100, opacity: 0, filter: "blur(10px)" }}
                            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                            transition={{
                                duration: 1,
                                ease: [0.22, 1, 0.36, 1],
                                delay: 0.2
                            }}
                            className="text-4xl font-black tracking-tighter md:text-8xl flex items-center gap-1 uppercase"
                        >
                            <span className="text-white">Chat</span>
                            <span className="text-blue-500">App</span>
                        </motion.div>

                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
                            className="absolute bottom-0 left-0 h-[3px] w-full origin-left bg-gradient-to-r from-blue-600 to-indigo-600"
                        />

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -inset-10 bg-blue-500/20 blur-[80px]"
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="absolute bottom-12 text-zinc-500 text-sm font-medium tracking-[0.2em] uppercase"
                    >
                        Initializing Experience
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
