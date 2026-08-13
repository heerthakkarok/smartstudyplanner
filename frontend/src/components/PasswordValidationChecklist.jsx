import React from 'react';
import { Check, Circle } from 'lucide-react';

export const getPasswordRules = (password = '') => {
  return [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /\d/.test(password) },
    { label: 'One special character (@$!%*?&^#()_-)', valid: /[@$!%*?&^#()_-]/.test(password) },
  ];
};

export const isPasswordValid = (password = '') => {
  return getPasswordRules(password).every((rule) => rule.valid);
};

const PasswordValidationChecklist = ({ password = '' }) => {
  const rules = getPasswordRules(password);

  return (
    <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
      <span className="font-semibold text-slate-400 block mb-1">Password Requirements:</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {rules.map((rule, idx) => (
          <div
            key={idx}
            className={`flex items-center space-x-2 transition-colors ${
              rule.valid ? 'text-emerald-400 font-medium' : 'text-slate-500'
            }`}
          >
            {rule.valid ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 stroke-[2]" />
            )}
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordValidationChecklist;
