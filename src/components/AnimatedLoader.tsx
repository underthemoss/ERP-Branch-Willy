"use client";

import { motion } from "framer-motion";

export function AnimatedLoader() {
  return null;
  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
      {/* Full screen animated gradient overlay */}
      <motion.div
        className="absolute inset-0 w-full h-full bg-gradient-to-tr from-cyan-500/50 via-transparent to-purple-500/50"
        animate={{
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Large central spinner */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-40 h-40 border-8 border-white/30 border-t-white rounded-full"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Animated waves covering full width */}
      <svg
        className="absolute bottom-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 1440 800"
      >
        <motion.path
          d="M0,400 C360,300,720,500,1080,400 C1260,350,1380,450,1440,400 L1440,800 L0,800 Z"
          fill="rgba(255,255,255,0.1)"
          animate={{
            d: [
              "M0,400 C360,300,720,500,1080,400 C1260,350,1380,450,1440,400 L1440,800 L0,800 Z",
              "M0,450 C360,350,720,450,1080,350 C1260,300,1380,400,1440,450 L1440,800 L0,800 Z",
              "M0,400 C360,300,720,500,1080,400 C1260,350,1380,450,1440,400 L1440,800 L0,800 Z",
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.path
          d="M0,500 C360,400,720,600,1080,500 C1260,450,1380,550,1440,500 L1440,800 L0,800 Z"
          fill="rgba(255,255,255,0.15)"
          animate={{
            d: [
              "M0,500 C360,400,720,600,1080,500 C1260,450,1380,550,1440,500 L1440,800 L0,800 Z",
              "M0,550 C360,450,720,550,1080,450 C1260,400,1380,500,1440,550 L1440,800 L0,800 Z",
              "M0,500 C360,400,720,600,1080,500 C1260,450,1380,550,1440,500 L1440,800 L0,800 Z",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.path
          d="M0,600 C360,500,720,700,1080,600 C1260,550,1380,650,1440,600 L1440,800 L0,800 Z"
          fill="rgba(255,255,255,0.2)"
          animate={{
            d: [
              "M0,600 C360,500,720,700,1080,600 C1260,550,1380,650,1440,600 L1440,800 L0,800 Z",
              "M0,650 C360,550,720,650,1080,550 C1260,500,1380,600,1440,650 L1440,800 L0,800 Z",
              "M0,600 C360,500,720,700,1080,600 C1260,550,1380,650,1440,600 L1440,800 L0,800 Z",
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>

      {/* Grid of pulsing dots across the screen */}
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 gap-4 p-20">
        {[...Array(48)].map((_, i) => (
          <motion.div
            key={i}
            className="w-full h-full flex items-center justify-center"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i % 8) * 0.1 + Math.floor(i / 8) * 0.2,
            }}
          >
            <div className="w-2 h-2 bg-white rounded-full" />
          </motion.div>
        ))}
      </div>

      {/* Bouncing dots in center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex space-x-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-4 h-4 bg-white rounded-full"
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      {/* Corner animations */}
      <motion.div
        className="absolute top-10 left-10 w-20 h-20 border-4 border-white/50 rounded-full"
        animate={{
          rotate: 360,
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute top-10 right-10 w-20 h-20 border-4 border-white/50 rounded-full"
        animate={{
          rotate: -360,
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute bottom-10 left-10 w-20 h-20 border-4 border-white/50 rounded-full"
        animate={{
          rotate: 360,
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-20 h-20 border-4 border-white/50 rounded-full"
        animate={{
          rotate: -360,
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}
