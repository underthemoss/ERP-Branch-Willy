"use client";
import React, { useEffect, useRef } from "react";
import * as jdenticon from "jdenticon";

export const AutoImage: React.FC<{ value: string; size?: number }> = ({
  value,
  size = 30,
}) => {
  const icon = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (icon.current) {
      const svg = jdenticon.toSvg(value, size);
      icon.current.innerHTML = svg;
    }
  }, [size, value]);

  return (
    <>
      <span ref={icon}></span>
    </>
  );
};
