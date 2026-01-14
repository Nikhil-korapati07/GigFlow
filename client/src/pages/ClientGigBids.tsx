import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { gigApi, Gig, Bid, User } from '../lib/api';

export default function ClientGigBids() {
  const { gigId } = useParams<{ gigId: string }>();
  const [gig, setGig] = useState<Gig | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!user || user.role !== 'client') {
      navigate('/login');
      return;
    }
    if (gigId) {
      loadBids();
    }
  }, [gigId, user, navigate]);

  const loadBids = async () => {
    if (!gigId) return;
    try {
      const response = await gigApi.getBids(gigId);
      setGig(response.gig);
      setBids(response.bids);
    } catch (error) {
      console.error('Failed to load bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHire = async (bidId: string) => {
    if (!gigId) return;
    if (!confirm('Are you sure you want to hire this freelancer?')) return;

    try {
      await gigApi.hire(gigId, bidId);
      alert('Freelancer hired successfully!');
      loadBids();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to hire freelancer');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!gig) {
    return <div className="p-8">Gig not found</div>;
  }

  const freelancerInfo = (bid: Bid): User => {
    if (typeof bid.freelancerId === 'object') {
      return bid.freelancerId as User;
    }
    return { id: bid.freelancerId as string } as User;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/client" className="text-indigo-600 hover:text-indigo-500">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{gig.title}</h1>
            <p className="text-gray-600 mb-4">{gig.description}</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                Budget: ${gig.budget}
              </span>
              <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm">
                Status: {gig.status}
              </span>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Bids ({bids.length})</h2>

          {bids.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
              No bids yet for this gig.
            </div>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => {
                const freelancer = freelancerInfo(bid);
                return (
                  <div
                    key={bid._id}
                    className={`bg-white p-6 rounded-lg shadow ${
                      bid.status === 'hired' ? 'border-2 border-green-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-semibold">
                            {typeof freelancer === 'object' ? freelancer.name : 'Freelancer'}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              bid.status === 'hired'
                                ? 'bg-green-100 text-green-800'
                                : bid.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {bid.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{bid.message}</p>
                        <p className="text-xl font-bold text-indigo-600">${bid.amount}</p>
                        {typeof freelancer === 'object' && (
                          <p className="text-sm text-gray-500 mt-2">Email: {freelancer.email}</p>
                        )}
                      </div>
                      {gig.status === 'open' && bid.status === 'pending' && (
                        <button
                          onClick={() => handleHire(bid._id)}
                          className="ml-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          Hire
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
