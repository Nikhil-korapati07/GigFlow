import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { gigApi, Gig } from '../lib/api';

export default function ClientDashboard() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    skills: '',
  });
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'client') {
      navigate('/login');
      return;
    }
    loadGigs();
  }, [user, navigate]);

  const loadGigs = async () => {
    try {
      const response = await gigApi.getMine();
      setGigs(response.gigs);
    } catch (error) {
      console.error('Failed to load gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await gigApi.create({
        title: formData.title,
        description: formData.description,
        budget: Number(formData.budget),
        deadline: formData.deadline,
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setFormData({ title: '', description: '', budget: '', deadline: '', skills: '' });
      setShowForm(false);
      loadGigs();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create gig');
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">GigFlow - Client Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">My Gigs</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              {showForm ? 'Cancel' : 'Create Gig'}
            </button>
          </div>

          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold mb-4">Create New Gig</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deadline</label>
                  <input
                    type="datetime-local"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Skills (comma-separated)</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Create Gig
                </button>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {gigs.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                No gigs yet. Create your first gig!
              </div>
            ) : (
              gigs.map((gig) => (
                <div key={gig._id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{gig.title}</h3>
                      <p className="mt-2 text-gray-600">{gig.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                          Budget: ${gig.budget}
                        </span>
                        <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                          Status: {gig.status}
                        </span>
                        <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                          Deadline: {new Date(gig.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      {gig.skills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {gig.skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/client/gigs/${gig._id}`}
                      className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                      View Bids
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
