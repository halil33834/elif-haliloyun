"use client";
import { motion } from "framer-motion";
import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
}

export default function Button({ variant = "primary", className, children, ...rest }: Props) {
  const styles = {
    primary: "bg-gradient-to-r from-purple to-pink text-white shadow-lg shadow-purple/30",
    ghost: "glass text-white",
    danger: "bg-red-600 text-white"
  };
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={clsx("px-5 py-3 rounded-2xl font-semibold transition-colors", styles[variant], className)}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
}
