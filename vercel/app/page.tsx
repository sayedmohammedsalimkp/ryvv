'use client'

import { useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Menu,
  MessageCircle,
  Moon,
  Play,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Wallet,
  X,
} from 'lucide-react'

const logoUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-HkQp5D4OXMKOh59TB00KAA0W56V2U4.png'

function Logo() {
  return <img src={logoUrl} alt="RYVV" className="h-9 w-auto object-contain" />
}

function PhoneMockup() {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const sendMessage = () => {
    if (!message.trim()) return
    setSent(true)
    setMessage('')
  }

  return (
    <div className="phone-shell mx-auto w-full max-w-[290px] rounded-[38px] p-2 shadow-2xl shadow-[#2255ff]/20">
      <div className="phone-screen overflow-hidden rounded-[31px] bg-[#f7f8fc]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 text-[10px] font-semibold text-slate-400">
          <span>9:41</span><span className="flex gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" /><span className="h-2 w-3 rounded-sm bg-slate-300" /></span>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 pb-4 pt-3">
          <div className="grid size-9 place-items-center rounded-full bg-[#2d6cff] text-white"><Sparkles size={16} /></div>
          <div><p className="text-sm font-bold text-slate-900">ryvv assistant</p><p className="text-[10px] text-emerald-500">online now</p></div>
        </div>
        <div className="flex min-h-[355px] flex-col gap-3 px-4 py-5 text-xs">
          <div className="max-w-[215px] rounded-2xl rounded-tl-sm bg-white p-3 text-slate-600 shadow-sm">Hi Alex. I&apos;m keeping an eye on your money. What would you like to do?</div>
          <div className="ml-auto max-w-[190px] rounded-2xl rounded-tr-sm bg-[#2868f4] p-3 text-white">How am I doing this month?</div>
          <div className="max-w-[225px] rounded-2xl rounded-tl-sm bg-white p-3 text-slate-600 shadow-sm">You&apos;re doing great. You&apos;ve spent 18% less than your monthly average.</div>
          {sent && <div className="ml-auto max-w-[190px] rounded-2xl rounded-tr-sm bg-[#2868f4] p-3 text-white">Got it — thanks!</div>}
          <div className="mt-auto flex gap-2 rounded-full border border-slate-200 bg-white p-1.5 pl-4 shadow-sm">
            <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) sendMessage() }} placeholder="Message ryvv" aria-label="Message ryvv" className="min-w-0 flex-1 bg-transparent text-[11px] outline-none" />
            <button onClick={sendMessage} aria-label="Send message" className="grid size-7 place-items-center rounded-full bg-[#2868f4] text-white transition hover:bg-[#1553df]"><Send size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardMockup() {
  const [active, setActive] = useState('Overview')
  return <div className="dashboard-card overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-2"><div className="grid size-7 place-items-center rounded-lg bg-[#2868f4] text-white"><Sparkles size={13} /></div><span className="text-xs font-bold">ryvv</span></div><div className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold">A</div></div>
    <div className="flex gap-1 border-b border-slate-100 px-5 pt-3">{['Overview', 'Spending', 'Goals'].map((item) => <button key={item} onClick={() => setActive(item)} className={`px-2 pb-3 text-[10px] font-semibold transition ${active === item ? 'border-b-2 border-[#2868f4] text-[#2868f4]' : 'text-slate-400 hover:text-slate-600'}`}>{item}</button>)}</div>
    <div className="grid gap-4 bg-[#fafbfe] p-5 sm:grid-cols-[1.1fr_.9fr]">
      <div><p className="text-[10px] font-medium text-slate-400">Total balance</p><p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">$12,840<span className="text-base">.52</span></p><p className="mt-1 text-[10px] font-semibold text-emerald-500">↑ 12.4% this month</p><div className="mt-6 h-24 w-full"><svg viewBox="0 0 260 90" className="h-full w-full" preserveAspectRatio="none"><path d="M0 74 C20 65 28 72 45 61 S70 55 85 58 S112 37 130 44 S150 54 165 40 S190 47 207 25 S235 31 260 10" fill="none" stroke="#2868f4" strokeWidth="3" strokeLinecap="round" /><path d="M0 74 C20 65 28 72 45 61 S70 55 85 58 S112 37 130 44 S150 54 165 40 S190 47 207 25 S235 31 260 10 V90 H0 Z" fill="url(#fill)" opacity=".12" /><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#2868f4" /><stop offset="1" stopColor="#2868f4" stopOpacity="0" /></linearGradient></defs></svg></div></div>
      <div className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold text-slate-500">This month</p><ChevronDown size={12} className="text-slate-400" /></div><div className="mt-4 flex items-end gap-1"><span className="text-xl font-bold text-slate-900">$2,460</span><span className="mb-0.5 text-[10px] text-slate-400">spent</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[64%] rounded-full bg-[#2868f4]" /></div><p className="mt-2 text-[9px] text-slate-400">64% of your $3,800 budget</p></div>
    </div>
    <div className="border-t border-slate-100 bg-white px-5 py-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold text-slate-700">Recent activity</p><button className="text-[10px] font-semibold text-[#2868f4]">View all</button></div>{[['Whole Foods','Groceries','-$84.20'],['Spotify','Subscriptions','-$11.99'],['Salary','Income','+$4,200']].map(([name, type, amount]) => <div key={name} className="flex items-center justify-between border-t border-slate-100 py-2.5"><div className="flex items-center gap-2"><div className="grid size-7 place-items-center rounded-full bg-slate-100 text-slate-500">{name === 'Salary' ? <Plus size={13} /> : <CreditCard size={13} />}</div><div><p className="text-[10px] font-semibold text-slate-700">{name}</p><p className="text-[9px] text-slate-400">{type}</p></div></div><span className={`text-[10px] font-bold ${amount.startsWith('+') ? 'text-emerald-500' : 'text-slate-700'}`}>{amount}</span></div>)}</div>
  </div>
}

export default function Page() {
  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)
  return <div className={dark ? 'dark min-h-screen bg-[#10131b] text-white' : 'min-h-screen bg-[#fcfcfd] text-slate-950'}>
    <header className="site-header sticky top-0 z-20 border-b border-slate-200/70 bg-[#fcfcfd]/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#10131b]/90"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"><a href="#top" aria-label="RYVV home"><Logo /></a><nav className="hidden items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-300 md:flex"><a href="#how-it-works" className="hover:text-[#2868f4]">How it works</a><a href="#dashboard" className="hover:text-[#2868f4]">Dashboard</a><a href="#security" className="hover:text-[#2868f4]">Security</a></nav><div className="flex items-center gap-2"><button onClick={() => setDark(!dark)} className="grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10" aria-label="Toggle color theme">{dark ? <Sun size={17} /> : <Moon size={17} />}</button><a href="#join" className="hidden rounded-full bg-[#2868f4] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1553df] sm:inline-flex">Get early access</a><button onClick={() => setMenuOpen(!menuOpen)} className="grid size-9 place-items-center rounded-full md:hidden" aria-label="Toggle navigation">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button></div></div>{menuOpen && <nav className="flex flex-col gap-4 border-t border-slate-200 px-5 py-5 text-sm font-medium dark:border-white/10 md:hidden"><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a><a href="#dashboard" onClick={() => setMenuOpen(false)}>Dashboard</a><a href="#security" onClick={() => setMenuOpen(false)}>Security</a></nav>}</header>
    <main id="top">
      <section className="hero-glow overflow-hidden"><div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-28 lg:pt-28"><div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b7cdfd] bg-[#edf3ff] px-3 py-1.5 text-xs font-bold text-[#2868f4] dark:border-[#2868f4]/30 dark:bg-[#2868f4]/10"><span className="size-1.5 rounded-full bg-[#2868f4]" />The money manager that gets you</div><h1 className="max-w-2xl text-5xl font-bold leading-[.98] tracking-[-.06em] text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">Money clarity,<br /><span className="text-[#2868f4]">without the work.</span></h1><p className="mt-7 max-w-lg text-lg leading-8 text-slate-500 dark:text-slate-300">RYVV is your personal money manager. Just talk to it on Telegram and watch your financial life organize itself.</p><div className="mt-9 flex flex-wrap gap-3"><a href="#join" className="inline-flex items-center gap-2 rounded-full bg-[#2868f4] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#2868f4]/20 transition hover:-translate-y-0.5 hover:bg-[#1553df]">Get early access <ArrowRight size={16} /></a><a href="#how-it-works" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-[#2868f4] hover:text-[#2868f4] dark:border-white/15 dark:bg-white/5 dark:text-white"><Play size={14} fill="currentColor" /> See how it works</a></div><div className="mt-8 flex items-center gap-3 text-xs text-slate-400"><div className="flex -space-x-2">{['#f4c7a1','#9cc5ed','#d7a9c6','#d7d28c'].map((c, i) => <span key={i} className="size-7 rounded-full border-2 border-[#fcfcfd] dark:border-[#10131b]" style={{ background: c }} />)}</div><span>Join 2,000+ people getting ahead</span></div></div><div className="relative flex justify-center lg:justify-end"><div className="absolute -left-3 top-12 size-20 rounded-full bg-[#8faeff]/25 blur-2xl" /><PhoneMockup /><div className="absolute -bottom-5 right-0 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#1a1f2b] sm:block"><div className="flex items-center gap-2"><div className="grid size-8 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check size={15} /></div><div><p className="text-xs font-bold text-slate-800 dark:text-white">You&apos;re on track</p><p className="text-[10px] text-slate-400">$320 saved this month</p></div></div></div></div></div></section>
      <section id="how-it-works" className="border-y border-slate-200 bg-white py-20 dark:border-white/10 dark:bg-[#151922] lg:py-28"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="mx-auto max-w-xl text-center"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#2868f4]">A better relationship with money</p><h2 className="mt-4 text-4xl font-bold tracking-[-.04em] text-slate-950 dark:text-white sm:text-5xl">Your money, on autopilot.</h2><p className="mt-5 leading-7 text-slate-500 dark:text-slate-300">No spreadsheets. No jargon. No guilt. RYVV makes staying on top of your money feel as easy as sending a message.</p></div><div className="mt-16 grid gap-5 md:grid-cols-3">{[[MessageCircle,'Talk naturally','Ask questions, log spending, or set a goal in the chat you already use.'],[CircleDollarSign,'See the full picture','RYVV quietly brings your accounts and habits into focus.'],[ShieldCheck,'Feel in control','Get thoughtful nudges before small decisions become big ones.']].map(([Icon, title, copy], i) => <div key={title as string} className="rounded-3xl border border-slate-200 bg-[#fafbfe] p-7 dark:border-white/10 dark:bg-white/5"><div className="grid size-11 place-items-center rounded-2xl bg-[#eaf0ff] text-[#2868f4] dark:bg-[#2868f4]/15"><Icon size={20} /></div><p className="mt-7 text-lg font-bold">{title as string}</p><p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">{copy as string}</p><span className="mt-7 block text-xs font-bold text-slate-300 dark:text-slate-500">0{i + 1}</span></div>)}</div></div></section>
      <section id="dashboard" className="overflow-hidden py-20 lg:py-28"><div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[.8fr_1.2fr] lg:px-8"><div><p className="text-sm font-bold uppercase tracking-[.18em] text-[#2868f4]">Everything in sync</p><h2 className="mt-4 text-4xl font-bold tracking-[-.05em] sm:text-5xl">A calm view of your whole financial life.</h2><p className="mt-5 max-w-md leading-7 text-slate-500 dark:text-slate-300">Your conversations and your dashboard speak the same language. Log a coffee in Telegram, and it&apos;s already reflected here.</p><div className="mt-8 flex flex-col gap-4 text-sm font-semibold"><span className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check size={13} /></span>Simple spending categories</span><span className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check size={13} /></span>Smart monthly snapshots</span><span className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check size={13} /></span>Goals that adapt with you</span></div><a href="#join" className="mt-9 inline-flex items-center gap-2 text-sm font-bold text-[#2868f4] hover:gap-3">Explore your future dashboard <ArrowRight size={16} /></a></div><DashboardMockup /></div></section>
      <section id="security" className="bg-[#111827] py-20 text-white lg:py-24"><div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-[1fr_1fr] lg:px-8"><div><div className="mb-5 grid size-12 place-items-center rounded-2xl bg-[#2868f4]"><ShieldCheck size={24} /></div><h2 className="text-4xl font-bold tracking-[-.04em] sm:text-5xl">Your trust is our<br />bottom line.</h2><p className="mt-5 max-w-md leading-7 text-slate-300">RYVV is built with privacy at the center. Your data is encrypted, never sold, and always yours.</p></div><div className="grid gap-4 sm:grid-cols-2">{[['Private by default','Your financial data is yours alone.'],['Bank-level security','Industry-standard encryption protects every connection.'],['No judgment, ever','Helpful insights, not shame or scare tactics.'],['Built for humans','Clear language, thoughtful defaults, full control.']].map(([title, copy]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="font-bold">{title}</p><p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p></div>)}</div></div></section>
      <section id="join" className="join-section px-5 py-24 lg:py-32"><div className="mx-auto max-w-3xl text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#2868f4] text-white shadow-xl shadow-[#2868f4]/20"><Bell size={25} /></div><h2 className="mt-7 text-4xl font-bold tracking-[-.05em] sm:text-6xl">Make money feel<br /><span className="text-[#2868f4]">a little lighter.</span></h2><p className="mx-auto mt-5 max-w-lg text-lg leading-7 text-slate-500 dark:text-slate-300">Be first to meet the money manager that works the way you do.</p>{joined ? <div className="mx-auto mt-9 flex max-w-md items-center justify-center gap-2 rounded-full bg-emerald-100 px-5 py-4 text-sm font-bold text-emerald-700"><Check size={17} /> You&apos;re on the list. We&apos;ll be in touch.</div> : <form onSubmit={(e) => { e.preventDefault(); if (email) setJoined(true) }} className="mx-auto mt-9 flex max-w-md flex-col gap-2 sm:flex-row"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Your email address" className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm outline-none ring-[#2868f4] transition focus:ring-2 dark:border-white/15 dark:bg-white/5" /><button className="rounded-full bg-[#2868f4] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1553df]" type="submit">Join the waitlist</button></form>}<p className="mt-4 text-xs text-slate-400">No spam. Just good money news.</p></div></section>
    </main>
    <footer className="border-t border-slate-200 px-5 py-8 dark:border-white/10"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-xs text-slate-400 sm:flex-row lg:px-3"><Logo /><div className="flex gap-5"><a href="#security" className="hover:text-[#2868f4]">Privacy</a><a href="#security" className="hover:text-[#2868f4]">Security</a><a href="#join" className="hover:text-[#2868f4]">Contact</a></div><span>© 2026 RYVV, Inc.</span></div></footer>
  </div>
}
