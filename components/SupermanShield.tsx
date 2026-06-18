export default function SupermanShield({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 100 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield outline */}
      <path
        d="M50 4 L94 22 L94 58 C94 82 72 104 50 111 C28 104 6 82 6 58 L6 22 Z"
        fill="#000"
        stroke="#fff"
        strokeWidth="3"
      />
      {/* S letter */}
      <path
        d="M62 32 C62 32 38 32 38 42 C38 52 62 52 62 62 C62 72 38 72 38 72"
        stroke="#fff"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
