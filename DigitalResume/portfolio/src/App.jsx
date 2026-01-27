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
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"
import RaceTrack from './components/RaceTrack';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedProject, setExpandedProject] = useState(null);

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
              "Led automation initiatives for the 'Hitachi Deployment Manager', scripting custom OVAs and deploying nodes in customer VCenters.",
              "Executed security hardening for CentOS/Linux environments to meet strict enterprise compliance standards.",
              "Architected robust RESTful integrations for database management systems, surpassing client performance expectations."
            ]
          }
        ]
      }
    ],

    certifications: [
      {
        title: "Generative AI Leader Certification",
        issuer: "Google",
        period: "Issued Sep 2025 · Expires Sep 2028",
        link: "https://www.credly.com/badges/db342e4d-2608-46d3-ab62-ba1c049c1a78/linked_in_profile",
        details: "Strategic leadership in Generative AI adoption and transformation."
      },
      {
        title: "AI Agents Fundamentals",
        issuer: "Hugging Face",
        period: "Issued Mar 2025",
        link: "/hf-cert.png",
        details: "Credential ID: nimo007. Foundational expertise in autonomous AI agents."
      },
    ],

    // Rewritten Projects
    projects: [
      {
        id: "01",
        name: "WINGMAN",
        company: "Deloitte (via Globant)",
        desc: "A revolutionary NL2SQL interface that grants analysts the power to converse with massive datasets through natural language.",
        impact: "Adopted as the primary intelligence layer for Deloitte Analysts.",
        tech: ["Gemini", "GCP", "Vertex AI", "LangChain", "PgVector", "React", "Python", "RAG"]
      },
      {
        id: "02",
        name: "VOICE AI",
        company: "Enterprise Client",
        desc: "A conversational bot with emotional intelligence, bridging the gap between human empathy and automated decision-making.",
        impact: "A next-gen replacement for enterprise call-center logic.",
        tech: ["AWS Nova Sonic 2", "OpenAI", "Gemini", "Python", "Twilio", "Redis"]
      },
      {
        id: "03",
        name: "VALUED",
        company: "Deloitte (via Globant)",
        desc: "A high-speed valuation engine utilizing Pythonic concurrency to automate complex financial modeling with millisecond precision.",
        impact: "Streamlined Deloitte's valuation services globally.",
        tech: ["FastAPI", "Pandas", "Celery", "React"]
      },
      {
        id: "04",
        name: "HITACHI OPS",
        company: "Hitachi (via Xoriant)",
        desc: "Automated configuration of mission-critical Datastore nodes. Implemented security hardening and OVA deployment scripts.",
        impact: "Zero-touch deployment for global data centers.",
        tech: ["Docker", "Python", "Bash", "VMware API"]
      },
      {
        id: "05",
        name: "ACME FIXED",
        company: "Cisco Systems (via Xoriant)",
        desc: "Architected a Python-Oracle middleware to modernize legacy SVN workflows, significantly reducing version control overhead.",
        impact: "Optimized version control workflows for enterprise scale.",
        tech: ["Flask", "Python", "Oracle 12c", "SVN"]
      },
      {
        id: "06",
        name: "LENDING CALC",
        company: "Lending Club (via Xoriant)",
        desc: "Engineered algorithmic investment scripts to automate portfolio management and maximize yield for high-volume users.",
        impact: "Automated investment strategies for scale.",
        tech: ["Python", "Automation", "Finance API"]
      },
      {
        id: "07",
        name: "T-HUB 365",
        company: "SAP (via Xoriant)",
        desc: "Built the automated testing backbone for SAP's high-throughput messaging hub, ensuring zero-defect releases for critical infrastructure.",
        impact: "Ensured 99.9% reliability for critical messaging hubs.",
        tech: ["Python", "Testing Framework", "SAP API"]
      }
    ],
    stack: [
      {
        category: "CORE ARSENAL",
        highlight: true,
        items: ["Python", "FastAPI", "GenAI Architecture", "LangChain", "GCP", "Distributed Systems"]
      },
      {
        category: "CLOUD & INFRA",
        items: ["AWS", "Kubernetes", "Docker", "Terraform", "Linux / Bash", "Jenkins"]
      },
      {
        category: "DATA & AI",
        items: ["RAG Systems", "PgVector", "Redis", "PostgreSQL", "Vertex AI", "OpenAI API"]
      },
      {
        category: "FRONTEND & TOOLS",
        items: ["React", "TailwindCSS", "Git", "Jira", "Vite"]
      }
    ]
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

      {/* --- RACE TRACK SIDEBAR --- */}
      <RaceTrack
        scrollPercentage={Math.min(scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1), 1)}
        isDarkMode={isDarkMode}
      />

      {/* --- NAVIGATION --- */}
      <nav className={`fixed top-0 w-full z-50 px-8 py-6 md:px-12 md:py-8 flex justify-between items-center backdrop-blur-md transition-all duration-500
        ${isDarkMode ? 'bg-[#0B0E14]/80 border-b border-white/5' : 'bg-[#F8FAFC]/80 border-b border-black/5'}
        translate-y-0 opacity-100`}>
        <div className="flex flex-col gap-1 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className={`text-[10px] font-bold tracking-[0.5em] transition-colors ${isDarkMode ? 'text-white' : 'text-black'}`}>NISHANT MODI</span>
          <span className="hidden md:inline-block text-[10px] text-zinc-500 font-mono tracking-widest">ARCHITECTURE & INTELLIGENCE</span>
        </div>

        <div className="flex items-center gap-8 md:gap-12">
          <div className="hidden md:flex gap-8 text-[10px] font-bold tracking-[0.2em] uppercase">
            {['About', 'Projects', 'Experience', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className={`transition-colors hover:text-blue-500 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {item}
              </a>
            ))}
          </div>

          <div className="flex gap-6 items-center">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`text-[10px] font-bold tracking-[0.4em]
                      uppercase hover:opacity-50 transition-all ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {isDarkMode ? "Light" : "Dark"}
            </button>
            <a href={profile.linkedin} target="_blank" rel="noreferrer"
              className={`transition-all ${isDarkMode ? 'text-white hover:text-blue-400' : 'text-black hover:text-blue-600'}`}>
              <Linkedin size={18} />
            </a>
          </div>
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
              className="text-xl md:text-2xl font-medium leading-loose opacity-80 border-l-2 border-blue-600 pl-6 md:pl-8 mb-12">
              {profile.summary}
            </p>

            <div className="flex flex-col md:flex-row gap-6 ml-6 md:ml-8 animate-reveal" style={{ animationDelay: '0.2s' }}>
              <a href="/resume.pdf" download
                className="px-8 py-4 bg-blue-600 text-white text-xs font-bold tracking-[0.2em] uppercase rounded-full hover:bg-blue-700 transition-all hover:scale-105 flex items-center gap-3 w-fit shadow-lg shadow-blue-600/20">
                <ArrowRight size={16} /> Download Resume
              </a>
              <a href="#projects"
                className={`px-8 py-4 border text-xs font-bold tracking-[0.2em] uppercase rounded-full transition-all hover:scale-105 flex items-center gap-3 w-fit
                 ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'}`}>
                View My Work
              </a>
            </div>
          </div>
        </div>



        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
          <ChevronDown size={30} />
        </div>
      </header>

      {/* --- EXPERTISE --- */}
      <section id="about" className="py-12 md:py-24 px-8 md:px-24 border-y border-zinc-800/50 relative z-20 max-w-7xl mx-auto w-full">
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
      <section id="projects" className="py-12 md:py-24 px-8 md:px-24 relative z-20 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-24">
          <h2 className="text-[10px] font-bold tracking-[0.6em] text-zinc-500 uppercase">Selected Works</h2>
          <p className="text-[10px] font-mono opacity-30 uppercase tracking-[0.2em]">Scale / Intelligence / Impact
          </p>
        </div>
        <div className="space-y-0">
          {profile.projects.map((proj, i) => (
            <div key={i}
              onClick={() => setExpandedProject(expandedProject === proj.id ? null : proj.id)}
              className={`group border-b transition-all duration-500 cursor-pointer overflow-hidden relative
              ${isDarkMode ? 'border-zinc-800/30' : 'border-zinc-200 hover:shadow-xl hover:shadow-blue-500/5'}
              ${expandedProject === proj.id ? 'py-12 bg-transparent' : 'py-12 md:py-20 hover:bg-transparent'}`}>

              {/* Active State Indicator Line */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-blue-500 transition-all duration-500 
                ${expandedProject === proj.id ? 'opacity-100' : 'opacity-0'}`} />

              <div className="flex flex-col md:flex-row md:items-center justify-between">
                {/* Reduced gap to bring number closer to name */}
                <div className="flex items-center gap-4 md:gap-6 pl-4 md:pl-8">
                  <span className={`text-xs font-mono transition-all ${expandedProject === proj.id ? 'text-blue-500 opacity-100' : 'opacity-20 group-hover:opacity-100'}`}>
                    {proj.id}
                  </span>
                  <h3 className={`text-4xl md:text-8xl font-black tracking-tighter transition-all 
                      ${expandedProject === proj.id ? 'text-blue-500' : 'group-hover:text-blue-500'}`}>
                    {proj.name}
                  </h3>
                </div>

                <div className="mt-8 md:mt-0 text-right pr-4 md:pr-8">
                  <p className={`text-sm font-bold mb-2 uppercase tracking-[0.3em] ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{proj.impact}</p>
                  <p className="text-zinc-500 max-w-sm ml-auto font-medium leading-relaxed">{proj.desc}</p>
                </div>
              </div>

              {/* EXPANDABLE SECTION */}
              {/* Added padding-left (pl-4 md:pl-16) to move Organization right */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-dashed border-blue-500/30 mt-12 pt-12 transition-all duration-500 ease-in-out pl-4 md:pl-16
                ${expandedProject === proj.id ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 hidden'}`}>

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.4em] text-blue-500 font-bold mb-4">Organization</h4>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>{proj.company}</p>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.4em] text-blue-500 font-bold mb-4">Tech Matrix</h4>
                  <div className="flex flex-wrap gap-2">
                    {proj.tech && proj.tech.map((t, idx) => (
                      <span key={idx} className={`text-xs font-mono px-3 py-1 rounded border transition-all duration-300 hover:scale-105 hover:bg-blue-600 hover:text-white hover:border-blue-500 cursor-default
                             ${isDarkMode ? 'border-white/10 bg-white/5 text-zinc-400' : 'border-black/5 bg-zinc-100 text-zinc-600'}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* --- PROFESSIONAL TIMELINE --- */}
      <section id="experience" className="py-12 md:py-24 px-8 md:px-24 relative z-20 max-w-7xl mx-auto w-full">
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
      <section id="tech" className="py-12 md:py-24 px-8 md:px-24 grid grid-cols-1 lg:grid-cols-2 gap-24 relative z-20 max-w-7xl mx-auto w-full">
        <div>
          <h2 className="text-[10px] font-bold tracking-[0.6em] text-zinc-500 uppercase mb-12">The Ecosystem</h2>
          <div className="space-y-12">
            {profile.stack.map((group, i) => (
              <div key={i}>
                <h3 className={`text-[10px] font-bold tracking-[0.4em] uppercase mb-6 flex items-center gap-3
                   ${group.highlight ? 'text-blue-500' : 'text-zinc-500'}`}>
                  {group.highlight && <Zap size={12} />} {group.category}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {group.items.map((tech, j) => (
                    <span key={j}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all hover:-translate-y-1 cursor-default
                      ${group.highlight
                          ? (isDarkMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700')
                          : (isDarkMode ? 'bg-zinc-900/50 border-white/5 text-zinc-400' : 'bg-white border-black/5 text-zinc-600')
                        }`}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
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

      {/* --- CERTIFICATIONS --- */}
      <section id="certs" className="py-12 md:py-24 px-8 md:px-24 relative z-20 max-w-7xl mx-auto w-full">
        <h2 className="text-[10px] font-bold tracking-[0.6em] text-zinc-500 uppercase mb-24 flex items-center gap-4">
          <Award size={16} /> Professional Certifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Certifications */}
          {profile.certifications.map((cert, i) => (
            <div key={`cert-${i}`}
              onClick={() => cert.link && window.open(cert.link, '_blank')}
              className={`p-12 border rounded-[30px] transition-all hover:scale-[1.02] cursor-pointer group
               ${isDarkMode ? 'border-zinc-800 bg-zinc-900/20 hover:border-blue-500/30' : 'border-zinc-200 bg-white shadow-xl shadow-blue-500/5 hover:border-blue-500/30'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-blue-500 font-mono text-xs font-bold block">{cert.period}</span>
                {cert.link && <ArrowUpRight size={16} className="text-zinc-500 group-hover:text-blue-500 transition-colors" />}
              </div>
              <h3 className="text-3xl font-black tracking-tighter mb-2">{cert.issuer}</h3>
              <p className="text-xl font-medium mb-6 opacity-80">{cert.title}</p>
              <div className="flex items-start gap-4">
                <Shield size={20} className="text-blue-500 shrink-0 mt-1" />
                <p className="text-sm leading-relaxed opacity-60 font-mono">{cert.details}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer id="contact" className="py-32 md:py-60 px-8 md:px-24 text-center relative z-20">
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
      <SpeedInsights />
      <Analytics />
    </div>
  );
};

export default App;
