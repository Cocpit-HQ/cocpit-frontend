import React from 'react';

interface JobDetailMapProps {
  location: string;
}

export const JobDetailMap: React.FC<JobDetailMapProps> = ({ location }) => {
  return (
    <div className="w-full h-full bg-ds-surface-1 relative overflow-hidden flex items-center justify-center">
      {location ? (
        <>
          <iframe
            width="100%"
            height="100%"
            className="border-0 relative z-0 opacity-90 contrast-125"
            loading="lazy"
            allowFullScreen
            src={`https://maps.google.com/maps?q=${encodeURIComponent(location)}&z=14&output=embed`}
          />
          <a
            href={`https://maps.google.com/maps?q=${encodeURIComponent(location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label="Open in Google Maps"
          />
        </>
      ) : (
        <div className="text-ds-text-secondary text-sm font-dm-sans">No location specified</div>
      )}
    </div>
  );
};

export default JobDetailMap;
