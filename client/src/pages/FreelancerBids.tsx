import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { bidApi, Bid, Gig } from '../lib/api';

export default function FreelancerBids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!user || user.role !== 'freelancer') {
      navigate('/login');
      return;
    }
    loadBids();
  }, [user, navigate]);

  const loadBids = async () => {
    try {
      const response = await bidApi.getMine();
      setBids(response.bids);
    } catch (error) {
      console.error('Failed to load bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGigInfo = (bid: Bid): Gig => {
    if (typeof bid.gigId === 'object') {
      return bid.gigId as Gig;
    }
    return { _id: bid.gigId as string } as Gig;
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
              <Link to="/freelancer" className="text-indigo-600 hover:text-indigo-500">
                ← Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">Welcome, {user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Bids</h2>

          <div className="space-y-4">
            {bids.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                You haven't placed any bids yet.
              </div>
            ) : (
              bids.map((bid) => {
                const gig = getGigInfo(bid);
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
                          <h3 className="text-xl font-semibold">
                            {typeof gig === 'object' && 'title' in gig ? gig.title : 'Gig'}
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
                        {typeof gig === 'object' && 'description' in gig && (
                          <p className="text-gray-600 mb-2">{gig.description}</p>
                        )}
                        <p className="text-lg font-semibold text-gray-900 mb-2">
                          Your Bid: <span className="text-indigo-600">${bid.amount}</span>
                        </p>
                        <p className="text-gray-600 mb-2">{bid.message}</p>
                        {typeof gig === 'object' && 'budget' in gig && (
                          <p className="text-sm text-gray-500">
                            Gig Budget: ${gig.budget} | Deadline:{' '}
                            {new Date(gig.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
