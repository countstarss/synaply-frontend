"use client";

import React, { useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface OptimizedAvatarProps {
  src?: string;
  fallback: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export const OptimizedAvatar = React.memo(
  ({ src, fallback, className, size = "md" }: OptimizedAvatarProps) => {
    const [imageError, setImageError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const handleImageError = useCallback(() => {
      setImageError(true);
    }, []);

    const handleImageLoad = useCallback(() => {
      setIsLoaded(true);
    }, []);

    return (
      <Avatar className={cn(sizeClasses[size], className)}>
        {!imageError && src && (
          <AvatarImage
            src={src}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: "opacity 0.2s ease-in-out",
            }}
          />
        )}
        <AvatarFallback
          className={cn(
            "transition-opacity duration-200",
            !imageError && src && isLoaded ? "opacity-0" : "opacity-100"
          )}
        >
          {fallback}
        </AvatarFallback>
      </Avatar>
    );
  }
);

OptimizedAvatar.displayName = "OptimizedAvatar";
