'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Building2 } from 'lucide-react';

export default function SearchBar({ onSelect }) {
  const [corps, setCorps] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch('/corp-data.json')
      .then((r) => r.json())
      .then((data) => {
        setCorps(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (q.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const lower = q.toLowerCase();
    const filtered = corps
      .filter(
        (c) =>
          c.n.includes(q) ||
          c.e.toLowerCase().includes(lower) ||
          c.s.startsWith(q)
      )
      .slice(0, 10);
    setResults(filtered);
    setIsOpen(filtered.length > 0);
  };

  const handleSelect = (corp) => {
    setQuery(corp.n);
    setIsOpen(false);
    onSelect(corp);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={isLoading ? '데이터 로딩 중...' : '회사명 또는 종목코드 검색 (예: 삼성전자, 005930)'}
          disabled={isLoading}
          className="w-full bg-navy-800 border border-navy-600 text-white placeholder-slate-500
            rounded-xl pl-12 pr-10 py-4 text-base focus:outline-none focus:border-gold
            transition-colors disabled:opacity-50"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-navy-800 border border-navy-600 rounded-xl
          overflow-hidden shadow-2xl shadow-black/50">
          {results.map((corp) => (
            <li key={corp.c}>
              <button
                onClick={() => handleSelect(corp)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-navy-700
                  transition-colors text-left"
              >
                <Building2 className="w-4 h-4 text-gold flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{corp.n}</div>
                  <div className="text-slate-400 text-sm truncate">{corp.e}</div>
                </div>
                <span className="text-gold text-sm font-mono flex-shrink-0">{corp.s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
