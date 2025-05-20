import React from 'react';

interface ExploreIconProps {
  onClick: () => void;
  className?: string;
}

const ExploreIcon: React.FC<ExploreIconProps> = ({
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 hover:bg-[color:var(--vscode-button-hoverBackground)] rounded-full focus:outline-none focus:ring-2 focus:ring-[color:var(--vscode-focusBorder)] ${className}`}
      aria-label="Explore"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[color:var(--vscode-editor-foreground)] h-4 w-4"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </button>
  );
};

export default ExploreIcon;
