"use client";

import * as React from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "framer-motion";

const GIPHY_API_KEY = "dc6zaTOxFJmzC"; // Public beta key

export function GifPicker({ onSelect }: { onSelect: (url: string) => void }) {
    const [search, setSearch] = React.useState("");
    const [gifs, setGifs] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    const fetchGifs = React.useCallback(async (query: string) => {
        setLoading(true);
        try {
            const url = query
                ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20`
                : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`;

            const res = await fetch(url);
            const data = await res.json();
            setGifs(data.data || []);
        } catch (err) {
            console.error("Giphy fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            fetchGifs(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, fetchGifs]);

    return (
        <div className="flex flex-col gap-3 w-[280px] h-[350px] bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-3">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                    placeholder="Search GIFs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500"
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <AnimatePresence>
                            {gifs.map((gif) => (
                                <motion.div
                                    key={gif.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => onSelect(gif.images.fixed_height.url)}
                                    className="relative aspect-square cursor-pointer rounded-lg overflow-hidden bg-white/5 border border-white/5"
                                >
                                    <img
                                        src={gif.images.fixed_height_small.url}
                                        alt={gif.title}
                                        className="w-full h-full object-cover"
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest text-center pt-1 border-t border-white/5">
                Powered by GIPHY
            </div>
        </div>
    );
}
