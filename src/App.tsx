import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Trophy, Gamepad2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const TICK_RATE = 150;

const TRACKS = [
  { id: 1, title: "NEON DREAMS v1.0", artist: "GEN-AI-01", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "CYBER PULSE v2.4", artist: "GEN-AI-02", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "GLITCH VOID v0.9", artist: "GEN-AI-03", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

// --- Components ---

const SnakeGame = ({ onScoreChange }: { onScoreChange: (score: number) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  const generateFood = useCallback((currentSnake: { x: number, y: number }[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Check if food is on snake
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    onScoreChange(0);
    setIsPaused(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
        case ' ': setIsPaused(prev => !prev); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = { x: prevSnake[0].x + direction.x, y: prevSnake[0].y + direction.y };

        // Wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          return prevSnake;
        }

        // Self collision
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Food collision
        if (head.x === food.x && head.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            onScoreChange(newScore);
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, TICK_RATE);
    return () => clearInterval(interval);
  }, [direction, food, gameOver, isPaused, generateFood, onScoreChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Food
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.beginPath();
    ctx.arc(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#00ffff' : 'rgba(0, 255, 255, 0.6)';
      if (index === 0) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
      }
      ctx.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2);
      ctx.shadowBlur = 0;
    });

  }, [snake, food]);

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan to-neon-magenta rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative bg-glitch-bg border border-neon-cyan/30 rounded-lg overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={400} 
          className="max-w-full h-auto block"
        />
        
        <AnimatePresence>
          {(gameOver || isPaused) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm"
            >
              {gameOver ? (
                <>
                  <h2 className="text-4xl font-bold text-neon-magenta glitch-text mb-2">SYSTEM CRASH</h2>
                  <p className="text-neon-cyan mb-6">FINAL SCORE: {score}</p>
                  <button 
                    onClick={resetGame}
                    className="flex items-center gap-2 px-6 py-3 bg-neon-magenta text-black font-bold rounded-sm hover:bg-neon-magenta/80 transition-colors uppercase tracking-widest"
                  >
                    <RefreshCw size={20} /> REBOOT
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-4xl font-bold text-neon-cyan glitch-text mb-2">PAUSED</h2>
                  <p className="text-white/60 mb-6">PRESS SPACE OR START TO CONTINUE</p>
                  <button 
                    onClick={() => setIsPaused(false)}
                    className="flex items-center gap-2 px-6 py-3 bg-neon-cyan text-black font-bold rounded-sm hover:bg-neon-cyan/80 transition-colors uppercase tracking-widest"
                  >
                    <Play size={20} /> INITIALIZE
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const MusicPlayer = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipTrack = (direction: 'next' | 'prev') => {
    let nextIndex = currentTrackIndex + (direction === 'next' ? 1 : -1);
    if (nextIndex >= TRACKS.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = TRACKS.length - 1;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
    // Audio source update is handled by useEffect
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentTrack.url;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      }
    }
  }, [currentTrackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const p = (audio.currentTime / audio.duration) * 100;
      setProgress(p || 0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => skipTrack('next'));
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', () => skipTrack('next'));
    };
  }, [currentTrackIndex]);

  return (
    <div className="w-full max-w-md bg-black/40 border border-white/10 p-6 rounded-xl backdrop-blur-md">
      <audio ref={audioRef} />
      
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-neon-magenta to-neon-cyan rounded-lg flex items-center justify-center animate-pulse">
          <Music className="text-black" size={32} />
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="text-lg font-bold text-white truncate glitch-text">{currentTrack.title}</h3>
          <p className="text-sm text-white/50">{currentTrack.artist}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-neon-cyan shadow-[0_0_10px_#00ffff]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => skipTrack('prev')} className="text-white/60 hover:text-neon-cyan transition-colors">
            <SkipBack size={24} />
          </button>
          <button 
            onClick={togglePlay}
            className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-110 transition-transform"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          <button onClick={() => skipTrack('next')} className="text-white/60 hover:text-neon-cyan transition-colors">
            <SkipForward size={24} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/30 uppercase tracking-tighter">
          <Volume2 size={12} />
          <span>AUDIO_STREAM_ACTIVE</span>
          <div className="flex-1 h-[1px] bg-white/10" />
          <span>{Math.floor(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('snake-highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('snake-highscore', newScore.toString());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {/* Background FX */}
      <div className="scanline" />
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.1),transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="mb-8 text-center z-20">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl md:text-7xl font-black tracking-tighter text-white glitch-text mb-2"
        >
          NEON_GLITCH
        </motion.h1>
        <div className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.3em] text-neon-cyan">
          <span className="flex items-center gap-1"><Gamepad2 size={14} /> GAME_CORE</span>
          <span className="text-white/20">|</span>
          <span className="flex items-center gap-1"><Music size={14} /> AUDIO_LINK</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col lg:flex-row items-center justify-center gap-12 z-20 w-full max-w-6xl">
        
        {/* Left Stats (Desktop) */}
        <div className="hidden lg:flex flex-col gap-6 w-48">
          <div className="p-4 border border-neon-cyan/20 bg-black/40 rounded-lg">
            <div className="text-[10px] text-neon-cyan/50 mb-1 uppercase">Current Score</div>
            <div className="text-5xl font-black text-white font-digital glitch-text">{score.toString().padStart(4, '0')}</div>
          </div>
          <div className="p-4 border border-neon-magenta/20 bg-black/40 rounded-lg">
            <div className="text-[10px] text-neon-magenta/50 mb-1 uppercase">High Score</div>
            <div className="text-5xl font-black text-white font-digital glitch-text">{highScore.toString().padStart(4, '0')}</div>
          </div>
          <div className="p-4 border border-white/10 bg-black/40 rounded-lg">
            <div className="text-[10px] text-white/30 mb-2 uppercase">Status</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-500">SYSTEM_ONLINE</span>
            </div>
          </div>
        </div>

        {/* Center Game */}
        <div className="flex flex-col items-center gap-6">
          <SnakeGame onScoreChange={handleScoreChange} />
          
          {/* Mobile Stats */}
          <div className="flex lg:hidden gap-4 w-full justify-center">
            <div className="px-4 py-2 border border-neon-cyan/20 bg-black/40 rounded-lg text-center">
              <div className="text-[8px] text-neon-cyan/50 uppercase">Score</div>
              <div className="text-2xl font-black font-digital glitch-text">{score}</div>
            </div>
            <div className="px-4 py-2 border border-neon-magenta/20 bg-black/40 rounded-lg text-center">
              <div className="text-[8px] text-neon-magenta/50 uppercase">Best</div>
              <div className="text-2xl font-black font-digital glitch-text">{highScore}</div>
            </div>
          </div>
        </div>

        {/* Right Player */}
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          <MusicPlayer />
          
          <div className="w-full p-4 border border-white/5 bg-black/20 rounded-lg text-[10px] text-white/40 leading-relaxed">
            <p className="mb-2 font-bold text-white/60 uppercase tracking-widest">System Log:</p>
            <p>&gt; Initializing neural audio engine...</p>
            <p>&gt; Loading synth_wave_v4.2.bin</p>
            <p>&gt; Calibrating glitch oscillators...</p>
            <p>&gt; Connection established with GEN-AI-NET</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-[10px] text-white/20 uppercase tracking-[0.5em] z-20">
        &copy; 2026 NEON_GLITCH_SYSTEMS // ALL_RIGHTS_RESERVED
      </footer>

      {/* Decorative Elements */}
      <div className="fixed bottom-8 left-8 hidden xl:block">
        <div className="w-1 h-32 bg-gradient-to-t from-neon-cyan to-transparent opacity-20" />
      </div>
      <div className="fixed top-8 right-8 hidden xl:block">
        <div className="w-32 h-1 bg-gradient-to-l from-neon-magenta to-transparent opacity-20" />
      </div>
    </div>
  );
}
