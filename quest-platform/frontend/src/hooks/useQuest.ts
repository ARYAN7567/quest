import { useState, useEffect } from 'react';
import api from '../api/axios';

interface Quest {
  id: number;
  title: string;
  description: string;
  price: number;
  is_paid: boolean;
  question_count: number;
}

interface Question {
  id: number;
  question_text: string;
  options: string[];
  question_order: number;
}

export const useQuests = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quests');
      setQuests(response.data.quests);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch quests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  return { quests, loading, error, refetch: fetchQuests };
};

export const useQuest = (id: string) => {
  const [quest, setQuest] = useState<Quest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPayment, setRequiresPayment] = useState(false);

  const fetchQuest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/quests/${id}`);
      setQuest(response.data.quest);
      setQuestions(response.data.questions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch quest');
      if (err.response?.data?.requiresPayment) {
        setRequiresPayment(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchQuest();
  }, [id]);

  return { quest, questions, loading, error, requiresPayment, refetch: fetchQuest };
};