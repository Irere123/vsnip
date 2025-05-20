import React from 'react';

interface LoadingSpinnerProps {
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className }) => {

  return (
    <div className='flex justify-center h-full w-full items-center'>
      <div className={`h-5 w-5 ${className}`}>
        <div
          style={{
            position: "relative",
            top: "50%",
            left: "50%",
          }}
          className={`loading-spinner h-5 w-5 ${className}`}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                animationDelay: `${-1.2 + 0.1 * i} s`,
                background: "gray",
                position: "absolute",
                borderRadius: "1rem",
                width: "30%",
                height: "8%",
                left: "-10%",
                top: "-4%",
                transform: `rotate(${30 * i}deg) translate(120%)`,
              }}
              className="animate-spinner"
            />
          ))}
        </div>
      </div >
    </div>
  );
};

export default LoadingSpinner;
