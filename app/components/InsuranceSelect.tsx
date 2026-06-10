'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  CUSTOM_INSURANCE_OPTION,
  SELF_PAY,
  addCustomInsurer,
  getAllInsurers,
  getCustomInsurers,
  isListedInsurer,
} from '../constants/kenyanInsurers';

const DEFAULT_SELECT_CLASS =
  'h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500';

interface InsuranceSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  showSearch?: boolean;
  selectClassName?: string;
  inputClassName?: string;
  customInputPlaceholder?: string;
}

export default function InsuranceSelect({
  value,
  onChange,
  required = false,
  showSearch = false,
  selectClassName = DEFAULT_SELECT_CLASS,
  inputClassName,
  customInputPlaceholder = 'Enter insurance provider name',
}: InsuranceSelectProps) {
  const [insuranceSearch, setInsuranceSearch] = useState('');
  const [customInsurers, setCustomInsurers] = useState<string[]>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    setCustomInsurers(getCustomInsurers());
  }, []);

  const allInsurers = useMemo(
    () => getAllInsurers(customInsurers),
    [customInsurers],
  );

  const filteredInsurers = useMemo(() => {
    if (!showSearch || !insuranceSearch.trim()) return allInsurers;
    const query = insuranceSearch.toLowerCase();
    return allInsurers.filter((name) => name.toLowerCase().includes(query));
  }, [allInsurers, insuranceSearch, showSearch]);

  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setIsCustomMode(false);
      setCustomInput('');
      return;
    }
    if (isListedInsurer(trimmed, customInsurers)) {
      setIsCustomMode(false);
      setCustomInput('');
      return;
    }
    setIsCustomMode(true);
    setCustomInput(trimmed);
  }, [value, customInsurers]);

  const selectValue = isCustomMode ? CUSTOM_INSURANCE_OPTION : value;

  const handleSelectChange = (next: string) => {
    if (next === CUSTOM_INSURANCE_OPTION) {
      setIsCustomMode(true);
      setCustomInput('');
      onChange('');
      return;
    }
    setIsCustomMode(false);
    setCustomInput('');
    onChange(next);
  };

  const handleCustomInputChange = (next: string) => {
    setCustomInput(next);
    onChange(next.trim());
  };

  const persistCustomInsurer = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    addCustomInsurer(trimmed);
    setCustomInsurers(getCustomInsurers());
  };

  return (
    <div className="space-y-2">
      {showSearch && (
        <Input
          placeholder="Search insurer…"
          value={insuranceSearch}
          onChange={(e) => setInsuranceSearch(e.target.value)}
          className="h-9 rounded-2xl border-slate-200 text-xs"
        />
      )}
      <select
        value={selectValue}
        onChange={(e) => handleSelectChange(e.target.value)}
        className={selectClassName}
        required={required && !isCustomMode}
      >
        <option value="">Select insurance provider</option>
        {filteredInsurers.map((insurer) => (
          <option key={insurer} value={insurer}>
            {insurer}
          </option>
        ))}
        <option value={SELF_PAY}>{SELF_PAY}</option>
        <option value={CUSTOM_INSURANCE_OPTION}>Add custom insurance…</option>
      </select>
      {isCustomMode && (
        <Input
          value={customInput}
          onChange={(e) => handleCustomInputChange(e.target.value)}
          onBlur={persistCustomInsurer}
          placeholder={customInputPlaceholder}
          className={inputClassName ?? 'h-11 rounded-2xl border-slate-200'}
          required={required}
        />
      )}
    </div>
  );
}
