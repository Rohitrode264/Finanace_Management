import { Search, X } from 'lucide-react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }: SearchInputProps) {
    return (
        <div className="search-wrapper">
            <Search size={14} className="search-icon" />
            <input
                type="text"
                className="search-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                spellCheck={false}
                autoComplete="off"
            />
            {value && (
                <button
                    className="search-clear"
                    onClick={() => onChange('')}
                    title="Clear search"
                    type="button"
                >
                    <X size={13} />
                </button>
            )}
        </div>
    );
}
