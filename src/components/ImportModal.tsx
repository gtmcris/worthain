import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Card, Button } from './UI';
import { useSettings } from '../contexts/SettingsContext';
import * as xlsx from 'xlsx';
import mammoth from 'mammoth';
import { cn } from '../lib/utils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (words: { term: string; translation: string; meaning: string }[]) => Promise<void>;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const { t } = useSettings();
  const [rawText, setRawText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);

  // Parse lines of text (comma, dash, or tab separated)
  const parseText = (text: string) => {
    const lines = text.split('\n');
    const parsedWords: { term: string; translation: string; meaning: string }[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Split by common delimiters: comma, hyphen surrounded by spaces, or tab
      const parts = line.split(/\s*(?:,| - |-|\t)\s*/);
      
      if (parts.length >= 2) {
        parsedWords.push({
          term: parts[0].trim(),
          translation: parts[1].trim(),
          meaning: parts.length >= 3 ? parts.slice(2).join(', ').trim() : '',
        });
      }
    }
    
    return parsedWords;
  };

  const handleTextImport = async () => {
    setError(null);
    if (!rawText.trim()) return;

    const words = parseText(rawText);
    if (words.length === 0) {
      setError('Could not extract any words. Ensure format is: Term, Translation, [Meaning]');
      return;
    }

    setIsImporting(true);
    try {
      await onImport(words);
      setRawText('');
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to import words.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to array of arrays
      const json: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      
      const words: { term: string; translation: string; meaning: string }[] = [];
      for (const row of json) {
        if (!row || row.length < 2) continue; // Skip empty rows or single columns
        if (typeof row[0] !== 'string' || typeof row[1] !== 'string') continue;

        words.push({
          term: row[0].trim(),
          translation: row[1].trim(),
          meaning: row[2] ? String(row[2]).trim() : '',
        });
      }

      if (words.length === 0) {
        throw new Error('No valid words found in Excel. Make sure Column A is Term and Column B is Translation.');
      }

      await onImport(words);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to read Excel file.');
    } finally {
      setIsImporting(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  const handleWordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsImporting(true);

    try {
      const data = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: data });
      const text = result.value;
      
      const words = parseText(text);
      
      if (words.length === 0) {
        throw new Error('No valid words found in Word document. Make sure format is Term, Translation.');
      }

      await onImport(words);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to read Word file.');
    } finally {
      setIsImporting(false);
      if (wordInputRef.current) wordInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                    Import Vocabulary
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Add multiple words at once from text, Excel, or Word.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-3 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
                  {error}
                </div>
              )}

              {/* Text Import Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Paste Text (Term, Translation, Meaning)
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Apfel, Apple, A common fruit&#10;Hund - Dog - A pet"
                  className="w-full h-32 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none transition-all"
                />
                <Button 
                  onClick={handleTextImport} 
                  disabled={isImporting || !rawText.trim()} 
                  className="w-full h-12 flex items-center justify-center gap-2"
                >
                  {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                  Import Text
                </Button>
              </div>

              <div className="flex items-center justify-center py-2">
                <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
                <span className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
                <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1" />
              </div>

              {/* File Import Section */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => excelInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors group disabled:opacity-50"
                >
                  <FileSpreadsheet size={28} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Excel (.xlsx)</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 mt-1">Col A: Term, Col B: Transl.</span>
                </button>
                <button
                  onClick={() => wordInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors group disabled:opacity-50"
                >
                  <FileText size={28} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Word (.docx)</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 mt-1">Text list</span>
                </button>
              </div>

              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                ref={excelInputRef}
                onChange={handleExcelUpload}
              />
              <input
                type="file"
                accept=".docx, .doc"
                className="hidden"
                ref={wordInputRef}
                onChange={handleWordUpload}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
