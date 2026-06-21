"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="grid min-h-[60vh] place-items-center text-center"><div><p className="font-display text-3xl font-semibold">Something went wrong</p><p className="mt-2 text-sm text-slate-500">The request could not be completed safely.</p><Button className="mt-5" onClick={reset}>Try again</Button></div></div>}
