"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Full-bleed background mode: wrapper becomes `absolute inset-0` instead
   * of `relative` (caller's own container must be `relative`/positioned).
   * Keeping `relative` and `absolute` as separate, mutually-exclusive
   * branches — instead of letting a caller-supplied `absolute` compete with
   * a hardcoded `relative` class on the same element — avoids depending on
   * Tailwind's generated CSS order to decide which `position` wins. */
  fill?: boolean;
}

/** A photo with a shimmering placeholder behind it until it finishes loading,
 * then a soft cross-fade — instead of a blank gap or an abrupt pop-in.
 *
 * Checks `img.complete` on mount in addition to the onLoad event: a cached
 * or same-origin image can finish loading before React attaches the
 * listener, in which case onLoad never fires and the image would stay
 * invisible forever. */
export function ProgressiveImage({ src, alt, className, imgClassName, fill = false }: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    if (imgRef.current?.complete) setLoaded(true);
  }, [src]);

  return (
    <div className={clsx(fill ? "absolute inset-0" : "relative", "overflow-hidden bg-surface-2", className)}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-surface-2 via-border/60 to-surface-2 bg-[length:200%_200%]" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={clsx(imgClassName, "transition-opacity duration-700 ease-out", loaded ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}
