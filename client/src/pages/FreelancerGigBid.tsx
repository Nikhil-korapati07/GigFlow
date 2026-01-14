import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { gigApi, bidApi, Gig } from '../lib/api';

export default function FreelancerGigBid() {
  const { gigId } = useParams<{ gigId: string }>();
  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    message: '',
  });
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!user || user.role !== 'freelancer') {
      navigate('/login');
      return;
    }
    if (gigId) {
      loadGig();
    }
  }, [gigId, user, navigate]);

  const loadGig = async () => {
    if (!gigId) return;
    try {
      const response = await gigApi.getOpen();
      const foundGig = response.gigs.find((g: Gig) => g._id === gigId);
      if (!foundGig) {
        alert('Gig not found or no longer open');
        navigate('/freelancer');
        return;
      }
      setGig(foundGig);
    } catch (error) {
      console.error('Failed to load gig:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gigId) return;

    setSubmitting(true);
    try {
      await bidApi.create(gigId, {
        amount: Number(formData.amount),
        message: formData.message,
      });
      alert('Bid placed successfully!');
      navigate('/freelancer/bids');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!gig) {
    return <div className="p-8">Gig not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/freelancer" className="text-indigo-600 hover:text-indigo-500">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{gig.title}</h1>
            <p className="text-gray-600 mb-4">{gig.description}</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                Budget: ${gig.budget}
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

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Place Your Bid</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bid Amount ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  required
                  rows={6}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Explain why you're the best fit for this gig..."
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Bid'}
                </button>
                <Link
                  to="/freelancer"
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
