import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

interface Quest {
  id: number;
  title: string;
  description: string;
  price: number;
  is_paid: boolean;
  question_count: number;
  enrolled_users: number;
  submissions_count: number;
  created_at: string;
}

const AdminQuests: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    is_paid: true,
  });

  const fetchQuests = async () => {
    try {
      const response = await api.get('/admin/all');
      setQuests(response.data.quests);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch quests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleOpenCreate = () => {
    setEditingQuest(null);
    setFormData({ title: '', description: '', price: 0, is_paid: true });
    setShowModal(true);
  };

  const handleEdit = (quest: Quest) => {
    setEditingQuest(quest);
    setFormData({
      title: quest.title,
      description: quest.description,
      price: quest.price,
      is_paid: quest.is_paid,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuest) {
        await api.put(`/quests/${editingQuest.id}`, formData);
        toast.success('Quest updated!');
      } else {
        await api.post('/quests', formData);
        toast.success('Quest created!');
      }
      setShowModal(false);
      fetchQuests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this quest?')) return;
    try {
      await api.delete(`/quests/${id}`);
      toast.success('Quest deleted!');
      fetchQuests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleViewQuestions = (questId: number) => {
    window.location.href = `/admin/quests/${questId}/questions`;
  };

  if (loading) return <div className="loading">Loading quests...</div>;

  return (
    <div className="admin-quests">
      <div className="page-header">
        <h1>Manage Quests</h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Create Quest
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Price</th>
              <th>Questions</th>
              <th>Enrolled</th>
              <th>Submissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quests.map((quest) => (
              <tr key={quest.id}>
                <td>
                  <strong>{quest.title}</strong>
                </td>
                <td className="truncate">{quest.description}</td>
                <td>{quest.is_paid ? `₹${quest.price}` : 'Free'}</td>
                <td>{quest.question_count}</td>
                <td>{quest.enrolled_users}</td>
                <td>{quest.submissions_count}</td>
                <td className="actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(quest)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={() => handleViewQuestions(quest.id)}>
                    Questions
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(quest.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingQuest ? 'Edit Quest' : 'Create Quest'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_paid}
                      onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                    />
                    Paid Quest
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingQuest ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuests;