"use client";

import React from "react"
import styled from "styled-components"

interface SendButtonProps {
  onClick?: () => void;
  className?: string;
}

const SendButton = ({ onClick, className }: SendButtonProps) => {
  return (
    <StyledWrapper className={className}>
      <button 
        onClick={onClick}
        className="flex items-center rounded-2xl bg-[#a855f7] hover:bg-[#9333ea] text-white text-[10px] sm:text-xs font-semibold px-3 py-1.5 sm:px-4 sm:py-2 pl-[0.8em] sm:pl-[0.9em] overflow-hidden transition-all duration-200 cursor-pointer active:scale-95 shadow-[0_4px_12px_rgba(168,85,247,0.35)] hover:shadow-[0_6px_15px_rgba(168,85,247,0.55)] border border-white/10"
      >
        <div className="svg-wrapper-1 flex items-center">
          <div className="svg-wrapper flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={16}
              height={16}
              className="transition-transform duration-300 origin-center sm:w-[20px] sm:h-[20px]"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                fill="currentColor"
                d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
              />
            </svg>
          </div>
        </div>
        <span className="ml-1 sm:ml-1.5 transition-transform duration-300">Mail</span>
      </button>
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: auto;

  button:hover .svg-wrapper {
    animation: fly-1 0.6s ease-in-out infinite alternate;
  }

  button:hover svg {
    transform: translateX(1.1em) rotate(45deg) scale(1.05);
  }

  button:hover span {
    transform: translateX(4em);
  }

  @keyframes fly-1 {
    from {
      transform: translateY(0.08em);
    }
    to {
      transform: translateY(-0.08em);
    }
  }
`

export default SendButton
