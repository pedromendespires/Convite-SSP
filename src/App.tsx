/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, Variants, useScroll, useSpring, BezierDefinition, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { MapPin, Heart, PartyPopper, Sparkles, Flower2, CalendarPlus, ChevronUp, MessageCircle, Share2, Gift, Timer, Wand2, Smile, PawPrint, Shield, Zap, Waves } from "lucide-react";
import { memo, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import confetti from "canvas-confetti";

// --- Constants & Variants ---

const EASE_CUSTOM: BezierDefinition = [0.22, 1, 0.36, 1];

const CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const ITEM_VARIANTS: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: EASE_CUSTOM,
    },
  },
};

const FLOATING_VARIANTS: Variants = {
  animate: (i: number) => ({
    y: [0, -15, 0],
    transition: {
      repeat: Infinity,
      duration: 3 + i * 0.8,
      ease: "easeInOut",
      delay: i * 0.4,
    },
  }),
};

// --- Sub-components ---

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1.5 bg-brand-blue z-50 origin-left"
      style={{ scaleX }}
    />
  );
};

const Background = memo(() => {
  const { scrollYProgress } = useScroll();
  
  // Create different parallax speeds
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -45]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.5 }}
        className="absolute inset-0"
      >
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-pink-200/25 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] bg-rose-200/25 rounded-full blur-[140px]" />
      </motion.div>
      
      {/* Parallax Flowers */}
      {[
        { pos: "top-[10%] left-[5%]", rot: -20, delay: 0.6, y: y1, r: rotate1 },
        { pos: "top-[15%] right-[8%]", rot: 20, delay: 0.8, y: y2, r: rotate2 },
        { pos: "bottom-[20%] left-[10%]", rot: 15, delay: 1.0, y: y3, r: rotate1 },
        { pos: "bottom-[15%] right-[5%]", rot: -15, delay: 1.2, y: y1, r: rotate2 }
      ].map((item, i) => (
        <motion.div 
          key={`flower-${i}`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ y: item.y, rotate: item.r }}
          transition={{ duration: 2, delay: item.delay, ease: EASE_CUSTOM }}
          className={`absolute ${item.pos} text-pink-400/20`}
        >
          <Flower2 size={120} strokeWidth={0.5} />
        </motion.div>
      ))}

      {/* Parallax Hearts & Illustrations */}
      {[
        { pos: "top-[40%] left-[15%]", delay: 1.4, y: y2, r: rotate2, icon: <Heart size={80} fill="currentColor" strokeWidth={0} />, color: "text-rose-300/15" },
        { pos: "bottom-[40%] right-[20%]", delay: 1.8, y: y3, r: rotate2, icon: <Heart size={80} fill="currentColor" strokeWidth={0} />, color: "text-rose-300/15" },
        { pos: "top-[75%] left-[5%]", delay: 2.4, y: y2, r: rotate1, icon: <Smile size={50} strokeWidth={1} />, color: "text-pink-300/15" }
      ].map((item, i) => (
        <motion.div 
          key={`deco-${i}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ y: item.y, rotate: item.r }}
          transition={{ duration: 2, delay: item.delay, ease: EASE_CUSTOM }}
          className={`absolute ${item.pos} ${item.color}`}
        >
          {item.icon}
        </motion.div>
      ))}
    </div>
  );
});

Background.displayName = "Background";

const CountdownUnit = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center">
    <div className="bg-white/60 backdrop-blur-sm w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg border border-white overflow-hidden relative">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 400,
            damping: 25
          }}
          className="text-2xl md:text-3xl font-bold text-brand-blue tabular-nums"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
    <span className="text-xs md:text-sm font-bold text-brand-accent mt-2 uppercase tracking-widest">{label}</span>
  </div>
);

const Countdown = ({ variants }: { variants: Variants }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date("2026-05-03T15:00:00").getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        clearInterval(interval);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div variants={variants} className="flex justify-center gap-4 md:gap-8 py-4">
      <CountdownUnit label="Dias" value={timeLeft.days} />
      <CountdownUnit label="Horas" value={timeLeft.hours} />
      <CountdownUnit label="Minutos" value={timeLeft.minutes} />
      <CountdownUnit label="Segundos" value={timeLeft.seconds} />
    </motion.div>
  );
};

const MagicTouch = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ 
      scale: 1.05,
      filter: "drop-shadow(0 0 15px rgba(219, 39, 119, 0.4))",
    }}
    whileTap={{ scale: 0.95 }}
    className={`inline-block transition-all duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

const Header = ({ variants }: { variants: Variants }) => {
  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#db2777", "#f472b6", "#fff1f2", "#60a5fa"]
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(triggerConfetti, 1500);
    return () => clearTimeout(timer);
  }, [triggerConfetti]);

  return (
    <motion.section variants={variants} className="relative pt-20">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-8">
        {[
          { color: "text-brand-blue", size: 24 },
          { color: "text-brand-accent", size: 32 },
          { color: "text-brand-blue", size: 24 }
        ].map((heart, i) => (
          <motion.div 
            key={i}
            custom={i}
            variants={FLOATING_VARIANTS}
            animate="animate"
            className={heart.color}
          >
            <Heart fill="currentColor" size={heart.size} />
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center mb-12">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={triggerConfetti}
          className="bg-white p-12 rounded-full shadow-2xl shadow-brand-blue/10 border border-brand-blue/5 cursor-pointer"
        >
          <PartyPopper className="w-24 h-24 text-brand-blue" aria-hidden="true" />
        </motion.button>
      </div>
      
      <div className="relative inline-block mb-10 group">
        <div className="absolute inset-0 bg-blue-100/50 -skew-x-12 rounded-2xl -z-10 border border-blue-200/40 transition-all group-hover:scale-110 group-hover:rotate-1 duration-700" />
        <MagicTouch>
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold px-4 sm:px-12 py-6 text-brand-blue drop-shadow-md tracking-tighter leading-tight">
            Sofia Samouco Pires
          </h1>
        </MagicTouch>
      </div>

      <div className="space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE_CUSTOM }}
          className="inline-block px-6 sm:px-10 py-3 sm:py-4 bg-brand-accent/10 rounded-full border border-brand-accent/20 shadow-sm backdrop-blur-sm"
        >
          <MagicTouch>
            <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-brand-accent font-bold italic tracking-tight">
              Faz 3 anos
            </h2>
          </MagicTouch>
        </motion.div>
        <p className="text-brand-blue/70 font-medium text-xl sm:text-2xl md:text-3xl max-w-2xl mx-auto leading-relaxed italic px-4">
          "O meu aniversário está a chegar e tu não podes faltar!"
        </p>
      </div>
    </motion.section>
  );
};

const WavyDivider = ({ className = "" }: { className?: string }) => (
  <div className={`w-full overflow-hidden leading-[0] ${className}`}>
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className="relative block w-[calc(120%+1.3px)] h-[40px] fill-brand-blue/5"
    >
      <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5,73.84-4.36,147.54,16.88,218.2,35.26,69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".5"></path>
      <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".25"></path>
      <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
    </svg>
  </div>
);

const Details = ({ variants }: { variants: Variants }) => (
  <div className="space-y-8 sm:space-y-12">
    <WavyDivider />
    <motion.section variants={variants} className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 items-center py-4">
      <MagicTouch className="space-y-2 sm:space-y-3">
        <span className="text-brand-blue/50 font-serif text-2xl sm:text-3xl italic">Domingo</span>
        <div className="text-brand-accent font-serif text-6xl sm:text-7xl font-bold tabular-nums">03</div>
        <span className="text-brand-blue font-serif text-2xl sm:text-3xl font-bold tracking-[0.2em] uppercase">Maio</span>
      </MagicTouch>

      <div className="flex justify-center order-first md:order-none">
        <MagicTouch>
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="w-32 h-32 sm:w-48 sm:h-48 flex items-center justify-center bg-white/40 rounded-full backdrop-blur-md border border-white/60 shadow-inner"
          >
            <Sparkles className="w-16 h-16 sm:w-24 sm:h-24 text-brand-accent/30" />
          </motion.div>
        </MagicTouch>
      </div>

      <MagicTouch className="space-y-2 sm:space-y-3">
        <span className="text-brand-blue/50 font-serif text-2xl sm:text-3xl italic">às</span>
        <div className="text-brand-accent font-serif text-6xl sm:text-7xl font-bold tabular-nums">15:00</div>
        <span className="text-brand-blue font-serif text-2xl sm:text-3xl font-bold tracking-[0.2em] uppercase">Horas</span>
      </MagicTouch>
    </motion.section>
    <WavyDivider className="rotate-180" />
  </div>
);

const Location = ({ variants }: { variants: Variants }) => (
  <motion.section variants={variants} className="space-y-8 sm:space-y-10 py-6">
    <div className="space-y-3 px-4">
      <h4 className="text-brand-blue font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">Local: Condomínio São Julião Terrace</h4>
      <p className="text-brand-accent font-medium text-xl sm:text-2xl italic opacity-70">
        (Oeiras)
      </p>
    </div>
    <div className="flex flex-col lg:flex-row justify-center items-center gap-4 sm:gap-6 pt-4 px-4">
      <motion.a
        href="https://www.google.com/maps/search/?api=1&query=Condomínio+São+Julião+Terrace,+R.+Ernesto+Veiga+de+Oliveira+22,+2780-052+Oeiras,+Portugal"
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 sm:px-12 py-4 sm:py-5 bg-brand-blue text-white rounded-full font-bold shadow-xl shadow-brand-blue/20 transition-all text-sm sm:text-base"
      >
        <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
        <span>Ver no Mapa</span>
      </motion.a>
      
      <motion.button
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          const event = {
            title: "Aniversário Sofia Samouco Pires- 3 Anos",
            start: "20260503T150000",
            end: "20260503T190000",
            location: "Condomínio São Julião Terrace, R. Ernesto Veiga de Oliveira 22, 2780-052 Oeiras, Portugal"
          };
          window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start}/${event.end}&details=${encodeURIComponent(event.title)}&location=${encodeURIComponent(event.location)}`, '_blank');
        }}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 sm:px-12 py-4 sm:py-5 bg-white border-2 border-brand-blue/10 text-brand-blue rounded-full font-bold shadow-lg hover:bg-brand-light-blue transition-all text-sm sm:text-base"
      >
        <CalendarPlus className="w-5 h-5 sm:w-6 sm:h-6" />
        <span>Guardar no Calendário</span>
      </motion.button>
    </div>
  </motion.section>
);

const GiftSuggestions = ({ variants }: { variants: Variants }) => (
  <motion.section variants={variants} className="bg-brand-accent/5 rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-12 border-2 border-brand-accent/10 space-y-6 sm:space-y-8">
    <div className="flex items-center justify-center gap-3">
      <Gift className="text-brand-accent w-5 h-5 sm:w-6 sm:h-6" />
      <h3 className="font-serif text-2xl sm:text-4xl text-brand-blue font-bold">Dicas da Sofia</h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
      {[
        { title: "Roupa", desc: "Tamanho 3-4 anos" },
        { title: "Calçado", desc: "Tamanho 24-25" },
        { title: "Gostos", desc: "Livros, puzzles e legos" }
      ].map((item, i) => (
        <div key={i} className="bg-white/60 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-white">
          <p className="font-bold text-brand-blue text-lg sm:text-xl mb-1">{item.title}</p>
          <p className="text-slate-600 text-sm sm:text-base">{item.desc}</p>
        </div>
      ))}
    </div>
  </motion.section>
);

const SofiaFavorites = ({ variants }: { variants: Variants }) => {
  const favorites = [
    { icon: <Waves className="w-10 h-10" />, label: "Stitch", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: <PawPrint className="w-10 h-10" />, label: "Urso Panda", color: "text-slate-800", bg: "bg-slate-100" },
    { icon: <Shield className="w-10 h-10" />, label: "Patrulha Pata", color: "text-red-500", bg: "bg-red-50" },
    { icon: <Zap className="w-10 h-10" />, label: "Pikachu", color: "text-yellow-500", bg: "bg-yellow-50" },
  ];

  return (
    <motion.section variants={variants} className="space-y-10 py-12">
      <div className="space-y-3">
        <h3 className="font-serif text-4xl sm:text-5xl text-brand-blue font-bold tracking-tight">As Coisas Favoritas</h3>
        <p className="text-brand-blue/60 text-lg italic">Pequenas ilustrações do que a Sofia mais gosta</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {favorites.map((fav, i) => (
          <div key={i}>
            <MagicTouch>
              <motion.div
                whileHover={{ y: -10 }}
                className={`${fav.bg} p-6 sm:p-8 rounded-[2rem] border border-white shadow-sm flex flex-col items-center gap-4 transition-colors hover:shadow-md`}
              >
                <div className={fav.color}>
                  {fav.icon}
                </div>
                <span className="font-bold text-brand-blue/80 text-sm sm:text-base uppercase tracking-wider">
                  {fav.label}
                </span>
              </motion.div>
            </MagicTouch>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

const RSVP = ({ variants }: { variants: Variants }) => {
  return (
    <motion.section 
      variants={variants} 
      className="bg-white/60 backdrop-blur-xl rounded-[3rem] sm:rounded-[5rem] p-8 sm:p-16 border border-white shadow-2xl shadow-brand-blue/10 space-y-6 sm:space-y-10"
    >
      <h3 className="font-serif text-4xl sm:text-6xl text-brand-blue leading-tight">Contamos contigo!</h3>
      <p className="text-slate-600 text-lg sm:text-2xl leading-relaxed">
        Confirma a tua presença, por favor, até ao dia <span className="font-bold text-brand-blue underline decoration-dotted underline-offset-8">26 de Abril</span>.
      </p>
    </motion.section>
  );
};

const Footer = ({ variants }: { variants: Variants }) => {
  return (
    <motion.footer variants={variants} className="pt-16 pb-24 space-y-10">
      <div className="space-y-4">
        <div className="flex justify-center gap-4 opacity-30">
          <Sparkles size={20} />
          <Heart size={20} fill="currentColor" />
          <Sparkles size={20} />
        </div>
        <p className="font-serif text-2xl text-brand-blue/80 italic tracking-tight">
          Com amor, Família Samouco Pires
        </p>
      </div>
    </motion.footer>
  );
};

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.5 }}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-8 right-8 p-4 bg-brand-blue text-white rounded-full shadow-2xl z-50 hover:bg-brand-blue/90 transition-colors"
      aria-label="Voltar ao topo"
    >
      <ChevronUp size={24} />
    </motion.button>
  );
};

const MagicCursor = () => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; type: 'star' | 'heart'; color: string }[]>([]);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      if (Math.random() > 0.7) {
        const id = Date.now() + Math.random();
        const type = Math.random() > 0.5 ? 'star' : 'heart';
        const colors = ['#f472b6', '#60a5fa', '#fbbf24', '#ffffff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        setParticles(prev => [...prev.slice(-15), { id, x: e.clientX, y: e.clientY, type, color }]);
        setTimeout(() => {
          setParticles(prev => prev.filter(p => p.id !== id));
        }, 1000);
      }
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile, cursorX, cursorY]);

  if (isMobile) return null;

  return (
    <>
      <style>{`
        body { cursor: none !important; }
        a, button { cursor: none !important; }
      `}</style>
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] text-brand-accent drop-shadow-lg"
        style={{ x: cursorX, y: cursorY, translateX: '-20%', translateY: '-80%' }}
      >
        <Wand2 size={32} />
      </motion.div>
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 1, x: p.x, y: p.y }}
            animate={{ 
              opacity: 0, 
              scale: 0, 
              y: p.y + (Math.random() * 50 + 20),
              x: p.x + (Math.random() * 40 - 20)
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="fixed top-0 left-0 pointer-events-none z-[9998]"
            style={{ color: p.color }}
          >
            {p.type === 'star' ? <Sparkles size={16} fill="currentColor" /> : <Heart size={14} fill="currentColor" />}
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
};

// --- Main App ---

export default function App() {
  return (
    <div className="min-h-screen bg-brand-warm selection:bg-brand-blue/30 overflow-x-hidden antialiased text-slate-900">
      <ScrollProgress />
      <Background />
      <ScrollToTop />
      <MagicCursor />

      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-12">
        <motion.div
          variants={CONTAINER_VARIANTS}
          initial="hidden"
          animate="visible"
          className="space-y-24 text-center"
        >
          <Header variants={ITEM_VARIANTS} />
          
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3">
              <Timer className="text-brand-accent" />
              <h3 className="font-serif text-3xl text-brand-blue font-bold italic">A contagem decrescente começou!</h3>
            </div>
            <Countdown variants={ITEM_VARIANTS} />
          </div>

          <Details variants={ITEM_VARIANTS} />
          <Location variants={ITEM_VARIANTS} />
          <SofiaFavorites variants={ITEM_VARIANTS} />
          <GiftSuggestions variants={ITEM_VARIANTS} />
          <RSVP variants={ITEM_VARIANTS} />
          <Footer variants={ITEM_VARIANTS} />
        </motion.div>
      </main>
    </div>
  );
}

