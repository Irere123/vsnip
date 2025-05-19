import type { ChangeEvent } from 'react';

interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readonly?: boolean;
  ariaLabel?: string;
  type?: 'text' | 'password' | 'email';
  id?: string;
  size?: number;
}

const TextField = ({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  ariaLabel,
  type = 'text',
  id,
  size,
}: TextFieldProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <input
      value={value}
      onInput={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
      type={type}
      id={id}
      size={size}
    />
  );
};

export default TextField;
