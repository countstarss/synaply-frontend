'use client'
import React, { useEffect } from 'react';
import '@/app/globals.css';

const Loading = () => {
  useEffect(() => {
    const letters = document.querySelectorAll(".bouncing-text span");
    let delay = 0;

    const animateLetters = () => {
      letters.forEach((letter, index) => {
        setTimeout(() => {
          if (letter instanceof HTMLElement) {
            letter.style.animation = 'bounce-sequence 0.5s ease-in-out';
          }
        }, index * 200);
      });

      // 在所有字母动画完成后重新开始
      setTimeout(() => {
        letters.forEach((letter) => {
          if (letter instanceof HTMLElement) {
            letter.style.animation = 'none';
          }
        });
        // 短暂延迟后重新开始动画
        setTimeout(animateLetters, 500);
      }, letters.length * 200 + 500);
    };

    animateLetters();

    return () => {
      letters.forEach((letter) => {
        if (letter instanceof HTMLElement) {
          letter.style.animation = 'none';
        }
      });
    };
  }, []);

  return (
    <div className="flex justify-center gap-1 text-2xl bouncing-text mt-24">
      <span className="inline-block">D</span>
      <span className="inline-block">a</span>
      <span className="inline-block">o</span>
      <span className="inline-block"> </span>
      <span className="inline-block">M</span>
      <span className="inline-block">a</span>
      <span className="inline-block">n</span>
      <span className="inline-block">d</span>
      <span className="inline-block">a</span>
      <span className="inline-block">r</span>
      <span className="inline-block">i</span>
      <span className="inline-block">n</span>
    </div>
  );
};

export default Loading;
