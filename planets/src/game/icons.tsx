import React from "react";

interface IconProps {
  size?: number;
  className?: string;
}

const base = (size?: number) => ({
  width: size ?? 20,
  height: size ?? 20,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  stroke: "#061726",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const HeartIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M12 21c-5.2-3.7-9-7-9-10.6C3 7.4 5.2 5 8 5c1.7 0 3.2.9 4 2.3C12.8 5.9 14.3 5 16 5c2.8 0 5 2.4 5 5.4C21 14 17.2 17.3 12 21z" />
  </svg>
);

export const StarIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
  </svg>
);

export const RocketIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M12 2c4 2.5 6 6.5 6 10.5L15 16H9l-3-3.5C6 8.5 8 4.5 12 2z" fill="#fff" />
    <circle cx="12" cy="9.5" r="2.4" fill="#5bc9ff" />
    <path d="M9 16l-1.5 4L12 18l4.5 2L15 16" fill="#ff6b4a" />
    <path d="M12 18v4" stroke="#ffd23f" strokeWidth="2.4" />
  </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <rect x="5.5" y="4" width="4.5" height="16" rx="1.5" />
    <rect x="14" y="4" width="4.5" height="16" rx="1.5" />
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
);

export const SoundOnIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" fill="none" />
  </svg>
);

export const SoundOffIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M17 9.5l5 5M22 9.5l-5 5" fill="none" />
  </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M3 11.5L12 4l9 7.5" fill="none" />
    <path d="M6 10.5V20h12v-9.5" fill="none" />
    <rect x="10" y="14" width="4" height="6" />
  </svg>
);

export const RetryIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M4 12a8 8 0 108-8" fill="none" />
    <path d="M12 1v6L7 4z" />
  </svg>
);

export const BoltIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
  </svg>
);

export const BulbIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M12 2.5a6.5 6.5 0 014 11.6c-.8.7-1 1.6-1 2.4h-6c0-.8-.2-1.7-1-2.4A6.5 6.5 0 0112 2.5z" />
    <rect x="9" y="18" width="6" height="2.2" rx="1" />
    <rect x="10" y="21" width="4" height="1.6" rx="0.8" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className} fill="none" strokeWidth={3.2}>
    <path d="M4 12.5l5.5 5.5L20 6.5" />
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" fill="#fff" />
    <circle cx="12" cy="12" r="3.2" fill="#0e3055" />
    <circle cx="13" cy="11" r="1" fill="#fff" stroke="none" />
  </svg>
);

export const BrainIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path
      d="M9.5 3.5A2.8 2.8 0 006 6.2 3.2 3.2 0 004 9.4c0 .8.3 1.6.8 2.2A3.3 3.3 0 005.5 17a3.1 3.1 0 003 3.5c.8 0 1.5-.3 2-.8V5.4a2.8 2.8 0 00-1-1.9z"
      fill="#ff7ab8"
    />
    <path
      d="M14.5 3.5A2.8 2.8 0 0118 6.2a3.2 3.2 0 012 3.2c0 .8-.3 1.6-.8 2.2A3.3 3.3 0 0118.5 17a3.1 3.1 0 01-3 3.5c-.8 0-1.5-.3-2-.8V5.4a2.8 2.8 0 011-1.9z"
      fill="#ff9ccd"
    />
    <path d="M12 4.5v15" fill="none" />
  </svg>
);

export const XIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className} fill="none" strokeWidth={3.2}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" fill="#bfe6ff" />
    <path d="M12 6.5V12l3.8 2.4" fill="none" strokeWidth={2.4} />
  </svg>
);

export const TempIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M10 3.5a2 2 0 114 0V13a4.5 4.5 0 11-4 0z" fill="#ff6b4a" />
    <circle cx="12" cy="17" r="2.2" fill="#fff6e3" />
    <path d="M12 14.5V8" stroke="#fff6e3" strokeWidth={2.2} />
  </svg>
);

export const RulerIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <rect x="2.5" y="8.5" width="19" height="7" rx="1.5" fill="#3ee6c1" />
    <path d="M7 8.5v3.4M11 8.5v4.6M15 8.5v3.4M19 8.5v4.6" fill="none" />
  </svg>
);

export const MoonIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" fill="#ffe9ad" />
    <circle cx="17" cy="5" r="1" fill="#fff6e3" />
    <circle cx="20.5" cy="9" r="0.8" fill="#fff6e3" />
  </svg>
);

export const OrbitIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="4.2" fill="#ffd23f" />
    <ellipse cx="12" cy="12" rx="10" ry="4.2" fill="none" transform="rotate(-18 12 12)" />
    <circle cx="20.5" cy="8.4" r="1.6" fill="#3ee6c1" />
  </svg>
);

export const BookIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M12 5.5C10.5 4 8 3.5 5 3.5c-.8 0-1.5.6-1.5 1.4v12.2c0 .8.7 1.4 1.5 1.4 3 0 5.5.5 7 2 1.5-1.5 4-2 7-2 .8 0 1.5-.6 1.5-1.4V4.9c0-.8-.7-1.4-1.5-1.4-3 0-5.5.5-7 2z" fill="#ff7ab8" />
    <path d="M12 5.5v15" fill="none" />
    <path d="M6.5 8h3M6.5 11h3M14.5 8h3M14.5 11h3" fill="none" stroke="#fff6e3" strokeWidth={1.8} />
  </svg>
);

export const LockIcon: React.FC<IconProps> = ({ size, className }) => (
  <svg {...base(size)} className={className}>
    <path d="M7.5 10V7.5a4.5 4.5 0 019 0V10" fill="none" />
    <rect x="5.5" y="10" width="13" height="10" rx="2.5" />
    <circle cx="12" cy="15" r="1.8" fill="#fff6e3" />
  </svg>
);
