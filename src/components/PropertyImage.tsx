import React, { useEffect, useState } from 'react';
import {
  normalizePropertyImageUrl,
  PROPERTY_IMAGE_FALLBACK,
  usePropertyImageFallback
} from '../lib/propertyImage';

interface PropertyImageProps {
  src?: string | null;
  candidates?: string[];
  alt: string;
  className?: string;
  eager?: boolean;
  sizes?: string;
}

export const PropertyImage: React.FC<PropertyImageProps> = ({
  src,
  candidates,
  alt,
  className = '',
  eager = false,
  sizes
}) => {
  const uniqueCandidates = Array.from(new Set([
    src ? normalizePropertyImageUrl(src) : '',
    ...(candidates || []).map(normalizePropertyImageUrl)
  ].filter(Boolean)));

  const initialCandidates = uniqueCandidates.length > 0 ? uniqueCandidates : [PROPERTY_IMAGE_FALLBACK];
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setLoaded(false);
  }, [src, candidates?.join('|')]);

  const currentSrc = candidateIndex < initialCandidates.length
    ? initialCandidates[candidateIndex]
    : PROPERTY_IMAGE_FALLBACK;

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (candidateIndex < initialCandidates.length - 1) {
      setCandidateIndex((index) => index + 1);
      return;
    }
    usePropertyImageFallback(event);
    setLoaded(true);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1f2428]" aria-busy={!loaded}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#1f2428] via-[#303638] to-[#1f2428]" />
      )}
      <img
        src={currentSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      />
    </div>
  );
};
