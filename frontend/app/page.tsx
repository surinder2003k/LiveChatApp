"use client";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Shield, Zap, Users, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050507] text-white selection:bg-blue-500/30">
      <Navbar />

      {/* Grid Pattern Background */}
      <div className="fixed inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-40 md:pb-32 overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto text-center space-y-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(59,130,246,0.1)]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                The Future of Real-time Messaging
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1]"
              >
                Experience the Next-Gen <br />
                <span className="text-white">Chat</span>
                <span className="text-blue-500">App</span> Interface
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
              >
                Stop settling for basic. Build meaningful connections with a platform
                built for speed, security, and absolute visual excellence. Inspired by ed-tech giants.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-5 justify-center items-center pt-6"
              >
                <Link href="/chat">
                  <Button size="lg" className="h-14 px-10 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all hover:scale-105 active:scale-95 group">
                    Start Chatting Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button variant="ghost" size="lg" className="h-14 px-8 text-lg font-semibold text-zinc-300 hover:text-white hover:bg-white/5 rounded-2xl transition-all group">
                  <Play className="mr-2 w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="pt-12 flex flex-wrap justify-center gap-x-12 gap-y-6 text-zinc-500 font-medium text-sm md:text-base uppercase tracking-widest"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" /> End-to-End Encryption
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" /> Real-time Sync
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" /> Multi-Device Support
                </div>
              </motion.div>
            </div>
          </div>

          {/* Decorative Glowing Objects */}
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        </section>

        {/* Dynamic Features Grid */}
        <section className="py-32 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Everything You Need</h2>
              <p className="text-zinc-500 text-lg max-w-xl mx-auto">Packed with premium features that make real-time communication feel effortless and beautiful.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <PremiumCard
                icon={<Zap className="w-8 h-8 text-blue-400" />}
                title="Ultra-Low Latency"
                description="Our Socket.io architecture ensures your messages travel faster than light. No lag, just pure real-time data."
                gradient="bg-blue-500/10"
              />
              <PremiumCard
                icon={<Shield className="w-8 h-8 text-indigo-400" />}
                title="Clerk Protected"
                description="Enterprise-grade security with Gmail OAuth. Your data is protected by the industry leaders in identity management."
                gradient="bg-indigo-500/10"
              />
              <PremiumCard
                icon={<MessageSquare className="w-8 h-8 text-sky-400" />}
                title="Interactive UI"
                description="Micro-animations, seen ticks, and typing indicators. An interface that's alive and responsive to every action."
                gradient="bg-sky-500/10"
              />
            </div>
          </div>
        </section>

        {/* Massive CTA Section */}
        <section className="py-40">
          <div className="container mx-auto px-6 text-center">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative p-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-[3rem] overflow-hidden"
            >
              <div className="bg-[#0a0a0c] rounded-[2.9rem] p-16 md:p-24 space-y-8 relative overflow-hidden">
                {/* Internal Glow */}
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/5 blur-[100px]" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/5 blur-[100px]" />

                <h2 className="text-5xl md:text-7xl font-black tracking-tighter relative z-10">Stop Waiting. <br /> <span className="text-blue-500 uppercase">Start Chatting.</span></h2>
                <p className="text-zinc-400 text-xl max-w-xl mx-auto relative z-10">Join our growing community today and elevate your communication experience to the elite level.</p>

                <div className="pt-8 relative z-10">
                  <Link href="/chat">
                    <Button size="lg" className="h-16 px-14 text-xl font-black bg-white text-black hover:bg-zinc-200 rounded-3xl transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                      Claim Your Free Account
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-white/[0.05] bg-[#050507]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4 text-center md:text-left">
              <Brand className="justify-center md:justify-start" />
              <p className="text-zinc-500 text-sm max-w-sm">The ultimate real-time chat solution for modern teams and creators. Built for performance.</p>
            </div>
            <div className="flex gap-8 text-zinc-400 font-bold uppercase tracking-widest text-xs">
              <a href="#" className="hover:text-blue-500 transition-colors">Twitter</a>
              <a href="#" className="hover:text-blue-500 transition-colors">GitHub</a>
              <a href="#" className="hover:text-blue-500 transition-colors">Discord</a>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/[0.03] text-center text-zinc-600 text-sm font-medium">
            © 2026 ChatApp. Handcrafted for visual excellence.
          </div>
        </div>
      </footer>
    </div>
  );
}

function PremiumCard({ icon, title, description, gradient }: { icon: React.ReactNode, title: string, description: string, gradient: string }) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      className={`group relative p-8 rounded-[2rem] bg-zinc-900/40 border border-white/[0.05] hover:border-blue-500/30 transition-all overflow-hidden`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="relative z-10 space-y-6">
        <div className="p-4 rounded-2xl bg-zinc-800/50 w-fit group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-xl">
          {icon}
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
          <p className="text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}
