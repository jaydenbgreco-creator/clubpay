import React, { useState } from 'react';
import { useClub } from '../context/ClubContext';
import { clubsApi } from '../services/api';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Building2, X, Users
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';

const ClubManagementPage = () => {
  const { clubs, activeClub, switchClub, refreshClubs } = useClub();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingClub) {
        await clubsApi.update(editingClub.id, formData);
        toast.success('Club updated');
      } else {
        await clubsApi.create(formData);
        toast.success('Club created');
      }
      refreshClubs();
      setShowAddModal(false);
      setEditingClub(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save club');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (club) => {
    if (!window.confirm(`Delete "${club.name}"? This cannot be undone.`)) return;
    try {
      await clubsApi.delete(club.id);
      toast.success('Club deleted');
      refreshClubs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete club');
    }
  };

  const openEdit = (club) => {
    setEditingClub(club);
    setFormData({ name: club.name, description: club.description || '' });
    setShowAddModal(true);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }} data-testid="clubs-title">
            Clubs
          </h2>
          <p className="text-slate-500 mt-1">{clubs.length} club{clubs.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => { setEditingClub(null); setFormData({ name: '', description: '' }); setShowAddModal(true); }}
          className="btn-primary flex items-center gap-2"
          data-testid="add-club-btn"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Add Club
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <div
            key={club.id}
            className={`bg-white rounded-3xl shadow-sm border-2 p-6 transition-all hover:shadow-md cursor-pointer ${
              activeClub?.id === club.id ? 'border-[#0080c6]' : 'border-slate-100'
            }`}
            onClick={() => switchClub(club)}
            data-testid={`club-card-${club.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0080c6, #004b87)' }}>
                <Building2 className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(club); }}
                  className="p-2 text-slate-400 hover:text-[#0080c6] transition-colors rounded-xl hover:bg-slate-50"
                  data-testid={`edit-club-${club.id}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(club); }}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-xl hover:bg-slate-50"
                  data-testid={`delete-club-${club.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-1" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
              {club.name}
            </h3>
            {club.description && (
              <p className="text-sm text-slate-500 mb-3">{club.description}</p>
            )}
            <div className="flex items-center gap-2 mt-4">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-600">{club.member_count || 0} members</span>
            </div>
            {activeClub?.id === club.id && (
              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full" style={{ backgroundColor: '#e1eef9', color: '#0080c6' }}>
                Active
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900" style={{ fontFamily: 'Libre Franklin, sans-serif' }}>
                {editingClub ? 'Edit Club' : 'Add New Club'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditingClub(null); }} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Club Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. STEM Club"
                  required
                  data-testid="club-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  placeholder="Brief description of the club"
                  rows={3}
                  data-testid="club-desc-input"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingClub(null); }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-primary"
                  data-testid="save-club-btn"
                >
                  {saving ? 'Saving...' : editingClub ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ClubManagementPage;
