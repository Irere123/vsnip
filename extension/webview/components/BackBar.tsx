import React from 'react';

interface BackBarProps {
  onBack: () => void;
  className?: string;
}

const BackBar: React.FC<BackBarProps> = ({ onBack, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onBack}
      className={`flex items-center p-2 hover:bg-[color:var(--vscode-button-hoverBackground)] rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--vscode-focusBorder)] ${className}`}
      aria-label="Go back"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onBack();
        }
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[color:var(--vscode-editor-foreground)]"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      <span className="ml-1">Back</span>
    </button>
  );
};

export default BackBar;
