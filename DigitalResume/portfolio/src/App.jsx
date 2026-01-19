import React, { useState, useEffect, useRef } from 'react';
import {
  Github,
  Linkedin,
  Mail,
  ArrowRight,
  ArrowUpRight,
  Globe,
  Command,
  Zap,
  Layers,
  Search,
  Sparkles,
  Cpu,
  Shield,
  Activity,
  ChevronDown,
  BrainCircuit,
  Award,
  Users,
  Terminal,
  Bot,
  Database,
  Network
} from 'lucide-react';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  // Visual simulation of system cycles
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const profile = {
    name: "NISHANT MODI",
    role: "PRINCIPAL ARCHITECT | TECH LEAD",
    subRole: "GenAI & Distributed Ecosystems",
    location: "PUNE, INDIA",
    email: "modinishant90@gmail.com",
    linkedin: "https://www.linkedin.com/in/nishant-modi-65053073/",

    // Creative Summary
    summary: "A visionary orchestrator of digital complexity. For over a decade, I've been bridging the gap between bleeding-edge GenAI research and enterprise-grade reality, crafting systems that don't just process data—they reason through it.",

    // System Status Simulation
    systemNodes: [
      {
        label: "CONTEXT_INGESTION", icon:
          <Database size={14} />, status: "Active"
      },
      {
        label: "NEURAL_MAPPING", icon:
          <BrainCircuit size={14} />, status: "Processing"
      },
      {
        label: "AGENT_ORCHESTRATION", icon:
          <Bot size={14} />, status: "Standby"
      },
      {
        label: "KINETIC_OUTPUT", icon:
          <Zap size={14} />, status: "Optimized"
      }
    ],

    // Rewritten Expertise
    expertise: [
      {
        title: "Agentic Intelligence",
        icon:
          <BrainCircuit className="text-blue-500" />,
        desc: "Engineering autonomous digital workforces. I build multi-agent systems that leverage RAG and LLM tool-calling to solve problems with human-like intuition and machine-like precision."
      },
      {
        title: "Resilient Architecture",
        icon:
          <Cpu className="text-violet-500" />,
        desc: "Designing the nervous systems of modern enterprises. Expert in high-concurrency Python backends, GCP/AWS cloud-native patterns, and microservices that scale without friction."
      },
      {
        title: "Strategic Leadership",
        icon:
          <Shield className="text-emerald-500" />,
        desc: "Transforming teams into engineering powerhouses. I lead with a 'POC-to-Production' philosophy, ensuring that high-level innovation translates into tangible Fortune 500 impact."
      }
    ],

    // Rewritten Experience
    experience: [
      {
        company: "Globant Solutions",
        period: "2021 — BEYOND",
        roles: [
          {
            title: "Technical Lead",
            details: [
              "Commanding a 10-engineer elite squad to architect GenAI infrastructure that powers Deloitte's global analytical intelligence.",
              "Fostering a 'Systems Thinking' culture, where POCs are hardened into production-grade assets that win hackathons and client trust.",
              "Received 'Pat on Back' honors for navigating extreme technical ambiguity and delivering zero-downtime migrations."
            ]
          },
          {
            title: "Senior Software Engineer",
            details: [
              "Pioneered AI-augmented development cycles, successfully integrating LLMs into core Python workflows to achieve 30% faster deployment velocity.",
              "Crafted a suite of high-availability APIs that define the standard for performance and security within the Python community."
            ]
          }
        ]
      },
      {
        company: "Xoriant Solutions",
        period: "2014 — 2021",
        roles: [
          {
            title: "Senior Software Engineer",
            details: [
              "Architected robust, data-dense backends for Hitachi, specializing in MongoDB optimization and real-time distributed processing.",
              "Engineered state-of-the-art CI/CD pipelines that turned release days from a stressor into a non-event through radical automation."
            ]
          }
        ]
      }
    ],

    // Rewritten Projects
    projects: [
      {
        id: "01", name: "WINGMAN", desc: "A revolutionary NL2SQL interface that grants analysts the power to converse with massive datasets through natural language.", impact: "Adopted as the primary intelligence layer for Deloitte Analysts."
      },
      { id: "02", name: "VOICE AI", desc: "A conversational bot with emotional intelligence, bridging the gap between human empathy and automated decision-making.", impact: "A next-gen replacement for enterprise call-center logic." },
      { id: "03", name: "VALUED", desc: "A high-speed valuation engine utilizing Pythonic concurrency to automate complex financial modeling with millisecond precision.", impact: "Streamlined Deloitte's valuation services globally." }
    ],
    stack: ["Python", "FastAPI", "GCP", "AWS", "Agentic AI", "LangChain", "Agno", "Kubernetes", "RAG"]
  };

  return (
    <div className={`${isDarkMode ? 'bg-[#0B0E14] text-[#E2E8F0]' : 'bg-[#F8FAFC] text-[#111]'} min-h-screen
    transition-colors duration-1000 font-sans selection:bg-blue-600 overflow-x-hidden relative`}>

      {/* --- TEXTURE --- */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* --- KINETIC BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <h1 className="absolute text-[30vw] font-black opacity-[0.02] whitespace-nowrap leading-none" style={{
          transform: `translateX(${-scrollY * 0.4}px)`, top: '15%'
        }}>
          {profile.name} • LEAD ARCHITECT • {profile.name}
        </h1>
      </div>

      {/* --- CUSTOM CURSOR --- */}
      <div className="fixed w-4 h-4 bg-blue-600 rounded-full pointer-events-none z-[9999] transition-transform duration-200 ease-out mix-blend-difference"
        style={{ left: mousePos.x - 8, top: mousePos.y - 8, transform: `scale(${scrollY > 100 ? 1.5 : 2})` }} />

      {/* --- NAVIGATION --- */}
      <nav className={`fixed top-0 w-full z-50 px-8 py-6 md:px-12 md:py-8 flex justify-between items-center backdrop-blur-md transition-all duration-500
        ${isDarkMode ? 'bg-[#0B0E14]/80 border-b border-white/5' : 'bg-[#F8FAFC]/80 border-b border-black/5'}`}>
        <div className="flex flex-col gap-1">
          <span className={`text-[10px] font-bold tracking-[0.5em] transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>NISHANT MODI // PORTFOLIO '26</span>
          <span className="hidden md:inline-block text-[10px] text-zinc-500 font-mono tracking-widest">ARCHITECTURE & INTELLIGENCE</span>
        </div>
        <div className="flex gap-10 items-center">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`text-[10px] font-bold tracking-[0.4em]
                    uppercase hover:opacity-50 transition-all ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {isDarkMode ? "Light" : "Dark"}
          </button>
          <a href={profile.linkedin} target="_blank" rel="noreferrer"
            className={`transition-all ${isDarkMode ? 'text-white hover:text-blue-400' : 'text-black hover:text-blue-600'}`}>
            <Linkedin size={18} />
          </a>
        </div>
      </nav>

      {/* --- HERO --- */}
      <header className="relative h-screen flex flex-col justify-center px-8 md:px-24 max-w-7xl mx-auto w-full pt-20">
        <div className="z-20">
          <div className="flex items-center gap-4 mb-8 animate-reveal">
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span
                className="text-blue-500 font-bold text-[9px] tracking-[0.3em] uppercase tracking-[0.5em]">Enterprise
                GenAI Architect</span>
            </div>
          </div>
          <h1
            className="text-[14vw] md:text-[11vw] font-black leading-[0.8] tracking-tighter mb-8 md:mb-12 flex flex-col">
            <span>NISHANT</span>
            <span className="italic" style={{
              WebkitTextStroke: isDarkMode ? '1.5px white' : '1.5px black',
              color: 'transparent'
            }}>MODI</span>
          </h1>
          <div className="max-w-3xl">
            <p
              className="text-xl md:text-2xl font-medium leading-loose opacity-80 border-l-2 border-blue-600 pl-6 md:pl-8">
              {profile.summary}
            </p>
          </div>
        </div>



        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
          <ChevronDown size={30} />
        </div>
      </header>

      {/* --- EXPERTISE --- */}
      <section className="py-12 md:py-24 px-8 md:px-24 border-y border-zinc-800/50 relative z-20 max-w-7xl mx-auto w-full">
        <h2
          className="text-[10px] font-bold tracking-[0.6em] text-zinc-500 uppercase mb-24 flex items-center gap-4">
          <Network size={16} /> Architectural Focus
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {profile.expertise.map((item, i) => (
            <div key={i} className="group relative">
              <div
                className={`mb-10 w-16 h-16 rounded-3xl flex items-center justify-center group-hover:bg-blue-600 transition-all duration-500 transform group-hover:rotate-12 group-hover:scale-110 shadow-2xl
                ${isDarkMode ? 'bg-zinc-900 shadow-lg shadow-black/20' : 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tighter">{item.title}</h3>
              <p className="text-zinc-500 leading-relaxed text-sm font-medium">{item.desc}</p>
              <div className="mt-8 h-[1px] w-0 group-hover:w-full bg-blue-500 transition-all duration-700" />
            </div>
          ))}
        </div>
      </section>

      {/* --- PROJECTS --- */}
      <section className="py-12 md:py-24 px-8 md:px-24 relative z-20 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-24">
          <h2 className="text-[10px] font-bold tracking-[0.6em] text-zinc-500 uppercase">Selected Works</h2>
          <p className="text-[10px] font-mono opacity-30 uppercase tracking-[0.2em]">Scale / Intelligence / Impact
          </p>
        </div>
        <div className="space-y-0">
          {profile.projects.map((proj, i) => (
            <div key={i}
              className={`group py-12 md:py-20 border-b flex flex-col md:flex-row md:items-center justify-between transition-all duration-500 cursor-pointer overflow-hidden
              ${isDarkMode ? 'border-zinc-800/30 hover:bg-white/[0.02] hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-zinc-200 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5'}`}>
              <div className="flex items-center gap-12">
                <span
                  className="text-xs font-mono opacity-20 group-hover:opacity-100 transition-all">{proj.id}</span>
                <h3
                  className="text-5xl md:text-9xl font-black tracking-tighter group-hover:italic transition-all group-hover:text-blue-500">
                  {proj.name}</h3>
              </div>
              <div className="mt-8 md:mt-0 text-right">
                <p className={`text-sm font-bold mb-2 uppercase tracking-[0.3em] ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{proj.impact}</p>
                <p className="text-zinc-500 max-w-sm ml-auto font-medium leading-relaxed">{proj.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- PROFESSIONAL TIMELINE --- */}
      <section className="py-12 md:py-24 px-8 md:px-24 relative z-20 max-w-7xl mx-auto w-full">
        <h2
          className="text-[10px] font-bold tracking-[0.6em] text-zinc-500 uppercase mb-24 flex items-center gap-4">
          <Terminal size={16} /> Professional Trajectory
        </h2>
        <div className="space-y-40">
          {profile.experience.map((exp, i) => (
            <div key={i} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-3">
                <span
                  className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 font-mono text-[10px] font-bold">{exp.period}</span>
                <h3
                  className="text-5xl font-black tracking-tighter mt-6 opacity-40 group-hover:opacity-100 transition-opacity">
                  {exp.company}</h3>
              </div>
              <div className="lg:col-span-9 space-y-20">
                {exp.roles.map((role, j) => (
                  <div key={j} className="group">
                    <div className="flex items-center gap-6 mb-8">
                      <h4 className="text-xl md:text-2xl font-bold tracking-tighter">{role.title}</h4>
                      <div className={`h-[1px] flex-1 ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
                    </div>
                    <ul className="space-y-10">
                      {role.details.map((detail, k) => (
                        <li key={k} className="flex gap-8 group/item">
                          <span
                            className="text-blue-500 font-bold opacity-0 group-hover/item:opacity-100 transition-opacity translate-x-[-10px] group-hover/item:translate-x-0 transition-transform">→</span>
                          <p
                            className={`text-xl md:text-3xl font-medium text-zinc-500 transition-colors duration-500 tracking-tight leading-snug
                            ${isDarkMode ? 'group-hover/item:text-[#eee]' : 'group-hover/item:text-black'}`}>
                            {detail}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- STACK --- */}
      <section className="py-12 md:py-24 px-8 md:px-24 grid grid-cols-1 lg:grid-cols-2 gap-24 relative z-20 max-w-7xl mx-auto w-full">
        <div>
          <h2 className="text-[10px] font-bold tracking-[0.6em] text-zinc-500 uppercase mb-12">The Ecosystem</h2>
          <div className="flex flex-wrap gap-4">
            {profile.stack.map((tech, i) => (
              <span key={i}
                className={`px-8 py-4 rounded-[20px] border font-bold text-xl hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all hover:-translate-y-2 cursor-default
                ${isDarkMode ? 'bg-zinc-900/50 border-white/5 text-zinc-400' : 'bg-white border-black/5 text-zinc-600 shadow-sm'}`}>
                {tech}
              </span>
            ))}
          </div>
        </div>
        <div className={`p-12 rounded-[40px] border flex flex-col justify-center
          ${isDarkMode ? 'bg-[#0B0E14] border-white/5 shadow-2xl shadow-black/50' : 'bg-white border-zinc-100 shadow-[0_20px_40px_rgba(0,0,0,0.04)]'}`}>
          <h2
            className="text-[10px] font-bold tracking-[0.6em] text-zinc-500 uppercase mb-12 flex items-center gap-2">
            <Users size={14} className="text-blue-500" /> Human Impact
          </h2>
          <div className="space-y-8">
            <p className="text-3xl font-black tracking-tighter leading-tight">
              Mentored <span className="text-blue-500">150+ engineers</span> on GenAI adoption, bridging the
              gap between legacy engineering and the <span className="italic">AI-Native future.</span>
            </p>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-32 md:py-60 px-8 md:px-24 text-center relative z-20">
        <div className="mb-24">
          <p className="text-[10px] font-bold tracking-[0.8em] text-blue-500 uppercase mb-8">Initiate Connection
          </p>
          <h2 className="text-[8vw] font-black tracking-tighter italic outline-text" style={{
            WebkitTextStroke:
              isDarkMode ? '1.5px white' : '1.5px black', color: 'transparent'
          }}>
            {profile.name}
          </h2>
        </div>
        <div className="flex flex-col items-center gap-12">
          <a href={`mailto:${profile.email}`}
            className="text-2xl md:text-5xl font-bold underline underline-offset-[16px] decoration-blue-500/30 hover:decoration-blue-500 hover:text-blue-500 transition-all uppercase">
            {profile.email}
          </a>
          <div className="flex gap-16 mt-16 opacity-40 font-bold tracking-[0.3em] text-[10px]">
            <a href={profile.linkedin} target="_blank"
              className="hover:text-blue-500 transition-colors uppercase">LinkedIn</a>
            <a href="#" className="hover:text-blue-500 transition-colors uppercase">GitHub</a>
          </div>
          <p className="mt-32 text-[10px] opacity-10 font-mono uppercase tracking-[0.5em]">
            © {new Date().getFullYear()} NISHANT MODI • PUNE • ARCHITECTING AUTONOMY
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
