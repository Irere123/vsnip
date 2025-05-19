import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card = ({ children, className = '', onClick }: CardProps) => {
  return (
    <div className={`card ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
