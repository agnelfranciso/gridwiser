'use client';

import React, { useState } from 'react';
import {
  MotionConfig,
  AnimatePresence,
  motion,
  type Transition,
} from 'motion/react';
import { Sparkles } from 'lucide-react';

/**
 * Shared spring & curve tokens tuned for crisp SaaS UI interactions.
 * Keeps motion cohesive across tabs, modals, wizards, and timetable cards.
 */
export const EASE_SMOOTH: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const SPRING_PILL: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.8,
};

export const SPRING_MODAL: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
  mass: 0.85,
};

export const TRANSITION_VIEW: Transition = {
  duration: 0.28,
  ease: EASE_SMOOTH,
};

export const TRANSITION_FAST: Transition = {
  duration: 0.18,
  ease: EASE_SMOOTH,
};

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

interface AnimatedModalBackdropProps {
  open: boolean;
  onClose?: () => void;
  zIndexClass?: string;
  blurClass?: string;
  children: React.ReactNode;
}

/**
 * Consistent spring-animated modal shell with backdrop blur & smooth scale-in/out.
 * Children should render the inner dialog card.
 */
export function AnimatedModalShell({
  open,
  onClose,
  zIndexClass = 'z-50',
  blurClass = 'bg-black/80 backdrop-blur-md',
  children,
}: AnimatedModalBackdropProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TRANSITION_FAST}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose?.();
            }
          }}
          className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4 ${blurClass}`}
        >
          <motion.div
            key="modal-card"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={SPRING_MODAL}
            className="flex w-full justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Vibrant AI Import button whose outer gradient ring spins continuously on hover.
 */
export function AiImportButton({
  onClick,
  compact = false,
  hideLabelOnMobile = false,
}: {
  onClick: () => void;
  compact?: boolean;
  hideLabelOnMobile?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.97 }}
      className="group relative inline-flex items-center justify-center rounded-xl p-[1.5px] focus:outline-none"
    >
      {/* Subtle outer vibrant glow on hover */}
      <motion.span
        aria-hidden="true"
        animate={{ opacity: hovered ? 0.55 : 0 }}
        transition={TRANSITION_FAST}
        className="pointer-events-none absolute -inset-0.5 rounded-xl blur-md"
        style={{
          background:
            'linear-gradient(135deg, #3B82F6, #A855F7, #EC4899, #22D3EE)',
        }}
      />

      {/* Clipped spinning conic-gradient ring */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
      >
        <motion.span
          animate={{
            rotate: hovered ? 360 : 0,
            opacity: hovered ? 1 : 0.42,
          }}
          transition={
            hovered
              ? {
                  rotate: { duration: 1.5, repeat: Infinity, ease: 'linear' },
                  opacity: { duration: 0.2 },
                }
              : { duration: 0.3 }
          }
          className="absolute left-1/2 top-1/2 aspect-square w-[220%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              'conic-gradient(from 0deg, #3B82F6, #8B5CF6, #EC4899, #F59E0B, #22D3EE, #3B82F6)',
          }}
        />
      </span>

      {/* Inner dark surface */}
      <span
        className={`relative z-10 inline-flex items-center gap-1.5 rounded-[10.5px] bg-[#0B101D] font-semibold text-blue-100 transition-colors group-hover:bg-[#0D1426] group-hover:text-white ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs'
        }`}
      >
        <Sparkles
          className={`h-3.5 w-3.5 transition-colors ${
            hovered ? 'text-cyan-300' : 'text-blue-400'
          }`}
        />
        <span className={hideLabelOnMobile ? 'hidden sm:inline' : ''}>
          Import Using AI
        </span>
      </span>
    </motion.button>
  );
}
