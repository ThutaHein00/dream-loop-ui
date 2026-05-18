import type { Transition } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

export const pageTransition = {
  initial: { opacity: 0, scale: 0.985, filter: "blur(6px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 1.015, filter: "blur(6px)" },
  transition: { duration: 0.45, ease } as Transition,
}
