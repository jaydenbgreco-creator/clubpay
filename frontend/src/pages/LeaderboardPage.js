import React, { useState, useEffect } from 'react';
import { useClub } from '../context/ClubContext';
import { dashboardApi } from '../services/api';
import { Trophy, Crown, Medal, Award } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';

const LeaderboardPage = () => {
  const { activeClub } = useClub();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [activeClub]);

  const loadLeaderboard = async () => {
    try {
      const response = await dashboardApi.getLeaderboard(50, activeClub?.id);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }} data-testid="leaderboard-title">
          <Trophy className="w-8 h-8 text-amber-500 inline mr-2" />
          Leaderboard
        </h2>
        <p className="text-slate-500 mt-1">Top earners{activeClub ? ` in ${activeClub.name}` : ''}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* Second Place */}
              <div className="pt-8">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center card-hover" data-testid="podium-2nd">
                  <div className="w-16 h-16 bg-gradient-to-r from-slate-300 to-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 -mt-12 border-4 border-white shadow-lg">
                    <span className="text-2xl font-black text-white">2</span>
                  </div>
                  <Medal className="w-8 h-8 text-slate-400 mx-auto mb-2" strokeWidth={2} />
                  <p className="font-bold text-slate-900 truncate">{leaderboard[1]?.display_name}</p>
                  <p className="text-3xl font-black text-amber-500 mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {leaderboard[1]?.current_balance?.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">bucks</p>
                </div>
              </div>

              {/* First Place */}
              <div>
                <div className="bg-white rounded-3xl shadow-lg border-2 border-amber-200 p-6 text-center card-hover" data-testid="podium-1st">
                  <div className="w-20 h-20 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 -mt-14 border-4 border-white shadow-lg">
                    <Crown className="w-10 h-10 text-white" strokeWidth={2} />
                  </div>
                  <p className="font-black text-slate-900 text-lg truncate">{leaderboard[0]?.display_name}</p>
                  <p className="text-4xl font-black text-amber-500 mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {leaderboard[0]?.current_balance?.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">bucks</p>
                </div>
              </div>

              {/* Third Place */}
              <div className="pt-12">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center card-hover" data-testid="podium-3rd">
                  <div className="w-14 h-14 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 -mt-10 border-4 border-white shadow-lg">
                    <span className="text-xl font-black text-white">3</span>
                  </div>
                  <Award className="w-6 h-6 text-orange-400 mx-auto mb-2" strokeWidth={2} />
                  <p className="font-bold text-slate-900 truncate text-sm">{leaderboard[2]?.display_name}</p>
                  <p className="text-2xl font-black text-amber-500 mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {leaderboard[2]?.current_balance?.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">bucks</p>
                </div>
              </div>
            </div>
          )}

          {/* Rest of the leaderboard */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden" data-testid="leaderboard-list">
            {leaderboard.slice(3).map((member, idx) => (
              <div
                key={member.member_id}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                data-testid={`leaderboard-row-${idx + 4}`}
              >
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-600">
                  {idx + 4}
                </div>
                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
                  <span className="text-sky-600 font-bold">{member.display_name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{member.display_name}</p>
                  <p className="text-xs text-slate-500">{member.member_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-amber-500" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {member.current_balance?.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">bucks</p>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="p-12 text-center">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No members with balances yet</p>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default LeaderboardPage;
