"use client";
import { motion } from "framer-motion";
import clsx from "clsx";
import { ReactNode } from "react";

export default function Card({
  children,
  className,
  onClick,
  hover = true
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { scale: 1.03, y: -4 } : {}}
      className={clsx("glass rounded-3xl p-5 shadow-xl", onClick && "cursor-pointer", className)}
    >
      {children}
    </motion.div>
  );
}
