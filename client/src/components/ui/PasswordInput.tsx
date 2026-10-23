import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  leadingIcon?: React.ReactNode;
};

export function PasswordInput({ className = '', leadingIcon, ...inputProps }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      {leadingIcon && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
          {leadingIcon}
        </div>
      )}
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        className={`${className} ${leadingIcon ? 'pl-10' : ''} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        onMouseDown={(event) => event.preventDefault()}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex items-center justify-center rounded-r-xl px-3 text-slate-400 transition hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-500 dark:text-slate-500 dark:hover:text-rose-400"
      >
        {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
      </button>
    </div>
  );
}
