"use client";

import { useState } from "react";
import clsx from "clsx";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}

/** A photo with a shimmering placeholder behind it until it finishes loading,
 * then a soft cross-fade — instead of a blank gap or an abrupt pop-in. */
export function ProgressiveImage({ src, alt, className, imgClassName }: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={clsx("relative overflow-hidden bg-surface-2", className)}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface-2 via-border/60 to-surface-2 bg-[length:200%_200%]" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={clsx(imgClassName, "transition-opacity duration-700 ease-out", loaded ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}
