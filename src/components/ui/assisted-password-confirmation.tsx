"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface AssistedPasswordConfirmationProps {
  password: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AssistedPasswordConfirmation({
  password,
  onSuccess,
  onCancel,
}: AssistedPasswordConfirmationProps) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value;
    if (
      confirmPassword.length >= password.length &&
      val.length > confirmPassword.length
    ) {
      setShake(true);
    } else {
      setConfirmPassword(val);
    }
  };

  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shake]);

  // Trigger success callback when passwords match
  useEffect(() => {
    if (confirmPassword === password && onSuccess) {
      const timer = setTimeout(() => {
        onSuccess();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [confirmPassword, password, onSuccess]);

  const getLetterStatus = (letter: string, index: number) => {
    if (!confirmPassword[index]) return '';
    return confirmPassword[index] === letter
      ? 'bg-green-500/20'
      : 'bg-red-500/20';
  };

  const passwordsMatch = password === confirmPassword;

  const bounceAnimation = {
    x: shake ? [-10, 10, -10, 10, 0] : 0,
    transition: { duration: 0.5 },
  };

  const matchAnimation = {
    scale: passwordsMatch ? [1, 1.05, 1] : 1,
    transition: { duration: 0.3 },
  };

  const borderAnimation = {
    borderColor: passwordsMatch ? '#10B981' : '',
    transition: { duration: 0.3 },
  };

  return (
    <main className="relative flex min-h-screen w-full items-start justify-center px-4 py-10 md:items-center">
      <div className="z-10 flex w-full flex-col items-center">
        <div className="mx-auto flex h-full w-full max-w-lg flex-col items-center justify-center gap-8 bg-neutral-900 border border-neutral-800 p-8 md:p-12 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-xl md:text-2xl font-bold font-playfair text-white">Set Your Password</h2>
            <p className="text-xs text-neutral-400 font-outfit max-w-sm">
              Confirm your password by typing it exactly below. The indicator will guide you character by character.
            </p>
          </div>

          <div className="relative flex w-full flex-col items-start justify-center">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-xs text-purple-400 font-outfit font-semibold tracking-wider">Target:</span>
              <span className="text-xs text-neutral-400 font-mono tracking-wider">{password}</span>
            </div>
            
            {/* Visual feedback line showing progress dots */}
            <motion.div
              className="mb-4 h-[52px] w-full rounded-xl border border-neutral-800 bg-black/60 px-4 py-2 flex items-center"
              animate={{
                ...bounceAnimation,
                ...matchAnimation,
                ...borderAnimation,
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-lg flex items-center">
                <div className="z-10 flex h-full items-center justify-start bg-transparent tracking-[0.15em]">
                  {password.split('').map((_, index) => (
                    <div
                      key={index}
                      className="flex h-full w-4 shrink-0 items-center justify-center"
                    >
                      <span className="size-[6px] rounded-full bg-neutral-500"></span>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 top-0 z-0 flex h-full w-full items-center justify-start">
                  {password.split('').map((letter, index) => (
                    <motion.div
                      key={index}
                      className={`absolute h-full w-4 transition-all duration-300 ${getLetterStatus(
                        letter,
                        index,
                      )}`}
                      style={{
                        left: `${index * 16}px`,
                        scaleX: confirmPassword[index] ? 1 : 0,
                        transformOrigin: 'left',
                      }}
                    ></motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Input field with eye hide/unhide icon */}
            <motion.div
              className="h-[52px] w-full relative rounded-xl border border-neutral-800 bg-neutral-950 flex items-center"
              animate={matchAnimation}
            >
              <motion.input
                className="h-full w-full rounded-xl bg-transparent pl-4 pr-12 py-3 tracking-[0.4em] outline-none placeholder:tracking-normal focus:border-purple-500 text-white font-mono text-sm"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                animate={borderAnimation}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-neutral-400 hover:text-white cursor-pointer select-none"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </motion.div>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-neutral-500 hover:text-neutral-300 font-outfit transition cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
