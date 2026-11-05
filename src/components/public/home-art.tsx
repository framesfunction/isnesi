import type { SVGProps } from "react";

/** Open book with a child-like plant growing from it: learning as growth. */
export function GrowingBookIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 420 300"
      role="img"
      aria-label="Simple illustration of a plant growing from an open book, representing learning and opportunity"
      {...props}
    >
      <path
        d="M35 195 Q112 154 205 205 Q300 154 385 195 L385 265 Q295 220 205 270 Q110 220 35 265Z"
        fill="#ffffff"
        stroke="#1B3FA0"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path d="M205 205V267" stroke="#1B3FA0" strokeWidth="7" />
      <path
        d="M205 180 Q162 125 133 78 Q170 94 205 143 Q240 94 278 78 Q248 130 205 180"
        fill="#2E9E4F"
      />
      <circle cx="205" cy="54" r="27" fill="#FFC83D" />
      <path
        d="M104 206 Q150 189 185 219 M306 206 Q260 189 225 219"
        fill="none"
        stroke="#1B3FA0"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="72" cy="70" r="8" fill="#F47768" />
      <path
        d="M330 45l9 15 17 3-13 12 3 17-16-8-15 8 3-17-13-12 18-3z"
        fill="#FFC83D"
      />
    </svg>
  );
}

/** Diverse children playing together under a warm circle of light. */
export function KidsPlayingIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 380 250"
      role="img"
      aria-label="Playful illustration of diverse children learning and playing together"
      {...props}
    >
      <circle cx="190" cy="115" r="95" fill="#FFF1C8" />
      <path d="M85 185q-5-54 30-57t38 57" fill="#1B3FA0" />
      <circle cx="115" cy="98" r="27" fill="#9B5B3C" />
      <path d="M93 94q0-35 25-34 28 0 28 31" fill="#172443" />
      <path d="M222 190q-3-59 35-59t38 59" fill="#2E9E4F" />
      <circle cx="257" cy="102" r="27" fill="#C88758" />
      <path d="M230 94q4-37 31-34 25 3 25 34" fill="#34241E" />
      <path d="M145 180q0-47 42-47t43 47" fill="#F47768" />
      <circle cx="187" cy="105" r="26" fill="#7C4935" />
      <path d="M161 98q7-33 30-29 25 2 24 31" fill="#201B1A" />
      <circle cx="190" cy="29" r="8" fill="#FFC83D" />
      <path
        d="M44 53l10 16 18 3-14 13 3 18-17-9-16 9 3-18-14-13 18-3z"
        fill="#F47768"
      />
      <path
        d="M320 35l7 12 14 2-10 10 2 14-13-7-12 7 2-14-10-10 14-2z"
        fill="#2E9E4F"
      />
    </svg>
  );
}
