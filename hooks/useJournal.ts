import { useState, useEffect } from 'react';
import { JournalEntry } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const JOURNAL_STORAGE_KEY = '@mindful_journal';

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (title: string, content: string) => {
    try {
      const entry: JournalEntry = {
        id: Date.now().toString(),
        title,
        content,
        timestamp: Date.now(),
      };
      
      const updatedEntries = [entry, ...entries];
      await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
      return entry;
    } catch (error) {
      console.error('Failed to add journal entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const updatedEntries = entries.filter(e => e.id !== id);
      await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      throw error;
    }
  };

  return {
    entries,
    loading,
    addEntry,
    deleteEntry,
  };
}
