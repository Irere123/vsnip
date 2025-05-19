import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  appearance?: 'primary' | 'secondary';
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const Button = ({
  children,
  onClick,
  appearance = 'primary',
  className,
  disabled,
  ariaLabel,
}: ButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className} ${appearance === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'}`}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export default Button;
