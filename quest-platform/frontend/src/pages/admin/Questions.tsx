import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

interface Question {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: number;
  question_order: number;
}

const AdminQuestions: React.FC = () => {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    question_order: 0,
  });

  const fetchQuestions = async () => {
    if (!questId) return;
    try {
      const response = await api.get(`/questions/quest/${questId}`);
      setQuestions(response.data.questions);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [questId]);

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setFormData({
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      question_order: questions.length,
    });
    setShowModal(true);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      options: question.options,
      correct_answer: question.correct_answer,
      question_order: question.question_order,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questId) return;

    const validOptions = formData.options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      toast.error('At least 2 options required');
      return;
    }

    try {
      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion.id}`, formData);
        toast.success('Question updated!');
      } else {
        await api.post('/questions', { ...formData, quest_id: parseInt(questId) });
        toast.success('Question added!');
      }
      setShowModal(false);
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      toast.success('Question deleted!');
      fetchQuestions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleAddOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 2) return;
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  if (loading) return <div className="loading">Loading questions...</div>;

  return (
    <div className="admin-questions">
      <div className="page-header">
        <h1>Manage Questions</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/quests')}>
          ← Back to Quests
        </button>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Add Question
        </button>
      </div>

      <div className="questions-list">
        {questions.length === 0 ? (
          <div className="empty-state">
            <p>No questions added yet.</p>
            <button className="btn btn-primary" onClick={handleOpenCreate}>Add First Question</button>
          </div>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="question-card-admin">
              <div className="question-header">
                <span className="question-order">Q{question.question_order}</span>
                <h3>{question.question_text}</h3>
                <div className="question-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(question)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(question.id)}>
                    Delete
                  </button>
                </div>
              </div>
              <div className="question-options">
                {question.options.map((opt, idx) => (
                  <div key={idx} className={`option-item ${idx === question.correct_answer ? 'correct' : ''}`}>
                    <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                    <span className="option-text">{opt}</span>
                    {idx === question.correct_answer && <span className="correct-badge">✓ Correct</span>}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <h2>{editingQuestion ? 'Edit Question' : 'Add Question'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Question *</label>
                <textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Options *</label>
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="option-input-row">
                    <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      required={idx < 2}
                    />
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="correct_answer"
                        checked={formData.correct_answer === idx}
                        onChange={() => setFormData({ ...formData, correct_answer: idx })}
                      />
                      Correct
                    </label>
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemoveOption(idx)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddOption}>
                  + Add Option
                </button>
              </div>

              <div className="form-group">
                <label>Question Order</label>
                <input
                  type="number"
                  min="0"
                  value={formData.question_order}
                  onChange={(e) => setFormData({ ...formData, question_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingQuestion ? 'Update' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestions;