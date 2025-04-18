import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Layout from '../../components/layout/Layout';
import RealtimeNotification from '../../components/leaderboard/RealtimeNotification';
import ScoreInputForm from '../../components/scoreInput/ScoreInputForm';
import {
  formatRelativeToPar,
  formatThru,
  getScoreColorClass,
} from '../../lib/scoreFormatters';
import {
  getLeaderboard,
  getPlayersForTeam,
  getTeams,
} from '../../lib/supabaseQueries';
import { TournamentType } from '../../types/supabase';
import { supabase } from '../../utils/supabase-client';

type TabType = 'leaderboard' | 'scoreInput';

interface ScoreUpdateNotification {
  isVisible: boolean;
  teamName?: string;
  timestamp?: string;
}

// Define Player ID type
interface PlayerOption {
  id: string;
  initial: string;
  name: string;
}

export default function TournamentPage() {
  const router = useRouter();
  const { type } = router.query;
  const [activeTab, setActiveTab] = useState<TabType>('leaderboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [tournamentDetails, setTournamentDetails] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedTeamPlayers, setSelectedTeamPlayers] = useState<any[] | null>(
    null,
  );
  const [isLoadingPlayers, setIsLoadingPlayers] = useState<boolean>(false);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>(
    new Date().toLocaleTimeString(),
  );
  const [notification, setNotification] = useState<ScoreUpdateNotification>({
    isVisible: false,
  });
  const [recentlyUpdatedTeam, setRecentlyUpdatedTeam] = useState<string | null>(
    null,
  );
  const [showOriginalScoreInput, setShowOriginalScoreInput] =
    useState<boolean>(false);

  // Format tournament type for display (e.g., "2-man" -> "2-Man Scramble")
  const formatTournamentType = (type: string | string[] | undefined) => {
    if (!type || Array.isArray(type)) return 'Tournament';
    return type === '2-man' ? '2-Man Scramble' : '4-Man Scramble';
  };

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Fetch leaderboard data - wrapped in useCallback
  const fetchLeaderboardData = useCallback(
    async (tournamentType: TournamentType, showLoading = true) => {
      try {
        if (showLoading) {
          setIsLoading(true);
        } else {
          setIsUpdating(true);
        }

        const leaderboard = await getLeaderboard(tournamentType);
        console.log('Fetched leaderboard data:', leaderboard);
        setLeaderboardData(leaderboard);
        setTournamentDetails(leaderboard.tournament);
        setLastUpdateTime(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
        setIsUpdating(false);
      }
    },
    [setIsLoading, setIsUpdating],
  ); // Dependencies: state setters

  // Fetch initial data - wrapped in useCallback
  const fetchData = useCallback(async () => {
    if (!type || Array.isArray(type)) return;

    setIsLoading(true);
    try {
      const tournamentType = type as TournamentType;
      // Fetch details first if needed independently, otherwise leaderboard fetch includes it
      // const tournament = await getTournamentDetails(tournamentType);
      // setTournamentDetails(tournament);

      const teamsData = await getTeams(tournamentType);
      setTeams(teamsData);

      // Pass tournamentType directly to avoid depending on 'type' from outer scope
      await fetchLeaderboardData(tournamentType, false);
    } catch (error) {
      console.error('Error fetching tournament data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [type, fetchLeaderboardData, setIsLoading, setTeams]); // Dependencies: type, stable fetch fn, setters

  // Realtime update handler - defined outside useEffect, wrapped in useCallback
  const handleRealtimeUpdate = useCallback(
    (payload: any) => {
      console.log('Real-time update received:', payload);
      const tournamentType = type as TournamentType;
      if (!tournamentType) return; // Guard against missing type

      const teamId =
        (payload.new as any)?.team_id || (payload.old as any)?.team_id;
      if (teamId) {
        setRecentlyUpdatedTeam(teamId);
        setTimeout(() => {
          setRecentlyUpdatedTeam(null);
        }, 3000);
      }

      setTimeout(async () => {
        // Pass tournamentType directly
        await fetchLeaderboardData(tournamentType, false);
      }, 500);

      if (activeTab === 'leaderboard' && (payload.new || payload.old)) {
        try {
          if (teamId === selectedTeam) return;
          const team = teams.find((t) => t.id === teamId); // Depends on teams
          if (team) {
            setNotification({
              isVisible: true,
              teamName: team.name,
              timestamp: new Date().toLocaleTimeString(),
            });
          }
        } catch (err) {
          console.error('Error handling realtime notification:', err);
        }
      }
    },
    [
      type,
      teams,
      activeTab,
      selectedTeam,
      fetchLeaderboardData,
      setRecentlyUpdatedTeam,
      setNotification,
    ],
  ); // Dependencies: values read + stable fetch fn + setters

  // Effect for initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]); // Depends only on the stable fetchData callback

  // Effect for Supabase subscription
  useEffect(() => {
    if (!type || Array.isArray(type)) return;

    const tournamentType = type as TournamentType;

    console.log(`Setting up subscription for ${tournamentType}`);
    const channel = supabase
      .channel(`scores-updates-${tournamentType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scores',
          filter: `tournament_type=eq.${tournamentType}`,
        },
        handleRealtimeUpdate, // Use the stable callback
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to scores changes for ${tournamentType}`);
        }
      });

    // Cleanup function
    return () => {
      console.log(`Unsubscribing from realtime updates for ${tournamentType}`);
      supabase.removeChannel(channel);
    };
    // Depend on type (to resubscribe if route changes) and the stable handler callback
  }, [type, handleRealtimeUpdate]);

  // Toggle team expansion in leaderboard
  const toggleTeamExpansion = (teamId: string) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null);
    } else {
      setExpandedTeamId(teamId);
    }
  };

  // Get minimum required drives based on tournament type
  const getMinDrivesPerPlayer = () => {
    // Default to 5 drives for 2-man scramble
    // 3 drives for 4-man scramble
    if (type === '4-man') {
      return 3;
    }
    return 5;
  };

  // Dismiss notification
  const dismissNotification = () => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

  // Memoize data specifically for the styling useEffect dependency array
  const memoizedCoursePars = useMemo(() => {
    return tournamentDetails?.course_pars;
  }, [tournamentDetails?.course_pars]);

  const memoizedPlayerMap = useMemo(() => {
    const map = new Map<string, number>();
    if (leaderboardData?.leaderboard && selectedTeam) {
      const currentTeamData = leaderboardData.leaderboard.find(
        (item: any) => item.team.id === selectedTeam,
      );
      if (currentTeamData?.driveCounts) {
        currentTeamData.driveCounts.forEach((dc: any, index: number) => {
          if (index < 2 && dc.id) {
            map.set(dc.id, index);
          }
        });
      }
    }
    return map;
  }, [leaderboardData?.leaderboard, selectedTeam]);

  // Sort the leaderboard data by Gross score ascending first, then NET score
  const sortedLeaderboard = React.useMemo(() => {
    if (!leaderboardData?.leaderboard) return [];

    return [...leaderboardData.leaderboard].sort((a, b) => {
      // First sort by gross score (ascending)
      if (a.relativeToPar !== b.relativeToPar) {
        return a.relativeToPar - b.relativeToPar;
      }
      // Then sort by net score if gross is the same
      return a.netRelativeToPar - b.netRelativeToPar;
    });
  }, [leaderboardData?.leaderboard]);

  // Toggle between original score input and styled score input
  const toggleScoreInputMode = () => {
    setShowOriginalScoreInput((prev) => !prev);
  };

  // --- Effect to Fetch Players for Selected Team ---
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!selectedTeam) {
        setSelectedTeamPlayers(null); // Clear players if no team is selected
        return;
      }

      setIsLoadingPlayers(true);
      setSelectedTeamPlayers(null); // Clear previous players while loading
      try {
        console.log(`Fetching players for selected team: ${selectedTeam}`);
        const players = await getPlayersForTeam(selectedTeam);
        console.log('Fetched players:', players);
        setSelectedTeamPlayers(players);
      } catch (error) {
        console.error('Error fetching selected team players:', error);
        setSelectedTeamPlayers([]); // Set to empty array on error to avoid constant loading
      } finally {
        setIsLoadingPlayers(false);
      }
    };

    fetchPlayers();
  }, [selectedTeam]); // Re-run only when selectedTeam changes

  return (
    <Layout>
      {/* Reduce outer container padding */}
      <div className='container mx-auto px-1 py-4 md:px-2 md:py-8'>
        {/* Removed H1 Header */}

        {/* Sticky Tab Navigation */}
        <div className='sticky top-0 bg-white z-10 shadow-md border-b border-gray-200 mb-6'>
          {/* Reduce padding in sticky header */}
          <div className='flex space-x-8 justify-center max-w-7xl mx-auto px-2 sm:px-4 lg:px-6'>
            <button
              onClick={() => handleTabChange('leaderboard')}
              className={clsx(
                'py-3 px-1 border-b-2 font-medium text-sm', // Reduced padding
                activeTab === 'leaderboard'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              Leaderboard
            </button>
            <button
              onClick={() => handleTabChange('scoreInput')}
              className={clsx(
                'py-3 px-1 border-b-2 font-medium text-sm', // Reduced padding
                activeTab === 'scoreInput'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              Score Input
            </button>
          </div>
        </div>

        {/* Tab Content - Reduce padding */}
        <div className='py-2 max-w-7xl mx-auto px-1 sm:px-2 lg:px-4'>
          {isLoading ? (
            <div className='flex justify-center items-center h-64'>
              <p className='text-gray-500'>Loading...</p>
            </div>
          ) : (
            <AnimatePresence mode='wait' initial={false}>
              {activeTab === 'leaderboard' && (
                <motion.div
                  key='leaderboard'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Leaderboard Table - Container for scrolling & sticky header */}
                  <div className='bg-white shadow-md rounded-lg overflow-hidden'>
                    {/* Sticky Header Row - Always visible, abbreviated on mobile. Adjusted top offset. */}
                    <div className='sticky top-[0px] z-10 flex bg-gray-200 text-gray-700 uppercase text-xs leading-normal border-b border-gray-300'>
                      {/* Use spans with hidden/md:inline for title switching */}
                      <div className='py-2 px-2 md:px-3 text-left w-[35%] md:w-1/4'>
                        <span className='md:hidden'>T</span>
                        <span className='hidden md:inline'>Team</span>
                      </div>
                      <div className='py-2 px-1 md:px-3 text-center w-[15%] md:w-1/4'>
                        <span className='md:hidden'>G</span>
                        <span className='hidden md:inline'>Gross</span>
                      </div>
                      <div className='py-2 px-1 md:px-3 text-center w-[15%] md:w-1/4'>
                        <span className='md:hidden'>N</span>
                        <span className='hidden md:inline'>Net</span>
                      </div>
                      <div className='py-2 px-1 md:px-3 text-center w-[15%] md:w-1/4'>
                        <span className='md:hidden'>Thru</span>
                        <span className='hidden md:inline'>Thru</span>
                      </div>
                      <div className='py-2 px-2 md:px-3 text-center w-[20%] md:w-1/4'>
                        <span className='md:hidden'>M</span>
                        <span className='hidden md:inline'>Mulleys</span>
                      </div>
                    </div>

                    {/* Team Rows - Container for horizontal scroll if needed */}
                    <div className='overflow-x-auto'>
                      <div className='divide-y divide-gray-200 min-w-[360px]'>
                        {sortedLeaderboard.map((item: any) => (
                          <React.Fragment key={item.team.id}>
                            {/* Main Row - Adjusted widths and padding */}
                            <div
                              className={`flex items-center py-3 px-2 md:px-3 cursor-pointer hover:bg-gray-50 ${recentlyUpdatedTeam === item.team.id ? 'bg-blue-50 transition-colors duration-1000' : ''}`}
                              onClick={() => toggleTeamExpansion(item.team.id)}
                            >
                              {/* Team Name - Adjusted width */}
                              <div className='w-[35%] md:w-1/4 text-xs md:text-sm font-medium text-gray-800 flex items-center truncate pr-1'>
                                <span
                                  className={`inline-block mr-1 transition-transform duration-200 ${expandedTeamId === item.team.id ? 'transform rotate-90' : ''}`}
                                >
                                  ▶
                                </span>
                                {item.team.name}
                              </div>
                              {/* Scores & Thru - Adjusted widths & padding */}
                              <div
                                className={`w-[15%] md:w-1/4 text-center text-xs md:text-sm font-semibold px-1 ${getScoreColorClass(item.relativeToPar)}`}
                              >
                                {formatRelativeToPar(item.relativeToPar)}
                              </div>
                              <div
                                className={`w-[15%] md:w-1/4 text-center text-xs md:text-sm px-1 ${getScoreColorClass(item.netRelativeToPar)}`}
                              >
                                {formatRelativeToPar(item.netRelativeToPar)}
                              </div>
                              <div className='w-[15%] md:w-1/4 text-center text-xs md:text-sm px-1 text-gray-600'>
                                {formatThru(item.holesCompleted)}
                              </div>
                              {/* Mulleys - Adjusted width */}
                              <div className='w-[20%] md:w-1/4 text-center text-xs md:text-sm px-2 text-gray-600'>
                                {item.totalRemainingMulligans}
                              </div>
                            </div>

                            {/* Expanded Detail View - Reduce padding */}
                            {expandedTeamId === item.team.id && (
                              <div className='bg-gray-50 px-2 md:px-4 py-3 space-y-3'>
                                {/* Player Stats Section - Ultra Compact on mobile */}
                                <h3 className='text-base font-medium text-gray-900 mb-1'>
                                  Player Stats
                                </h3>
                                <div className='space-y-1 text-xs md:text-sm'>
                                  {item.driveCounts.map(
                                    (dc: any, index: number) => {
                                      const mulliganInfo =
                                        item.mulliganCounts.find(
                                          (mc: any) => mc.id === dc.id,
                                        );
                                      return (
                                        <div
                                          key={dc.id}
                                          className='flex justify-between'
                                        >
                                          <span>{dc.name}:</span>
                                          <span>
                                            <span
                                              className={
                                                dc.count >=
                                                getMinDrivesPerPlayer()
                                                  ? 'text-green-600'
                                                  : 'text-orange-600'
                                              }
                                            >
                                              {dc.count} Drives
                                            </span>
                                            <span className='ml-2 text-blue-600'>
                                              {mulliganInfo?.remaining || 0}{' '}
                                              Mulleys
                                            </span>
                                          </span>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>

                                {/* Hole Scores - Reduce padding */}
                                <h3 className='text-base font-medium text-gray-900 mb-2 mt-4'>
                                  Hole Scores
                                </h3>
                                <div className='overflow-x-auto'>
                                  <table className='min-w-full border border-gray-200 text-xs'>
                                    <thead>
                                      <tr className='bg-gray-50'>
                                        <th className='py-1 px-1 md:px-2 text-left font-medium text-gray-500 uppercase tracking-wider border-b'>
                                          Hole
                                        </th>
                                        {Array.from(
                                          { length: 18 },
                                          (_, i) => i + 1,
                                        ).map((hole) => (
                                          <th
                                            key={hole}
                                            className='py-1 px-1 md:px-2 text-center font-medium text-gray-500 uppercase tracking-wider border-b border-l'
                                          >
                                            {hole}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className='bg-white divide-y divide-gray-200'>
                                      {/* Par Row */}
                                      <tr>
                                        <td className='py-1 px-1 md:px-2 font-medium text-gray-900 border-r'>
                                          Par
                                        </td>
                                        {Array.from(
                                          { length: 18 },
                                          (_, i) => i + 1,
                                        ).map((hole) => {
                                          const holePar =
                                            tournamentDetails?.course_pars[
                                              hole.toString()
                                            ] || '–';
                                          return (
                                            <td
                                              key={hole}
                                              className='py-1 px-1 md:px-2 text-center text-gray-800 border-r'
                                            >
                                              {holePar}
                                            </td>
                                          );
                                        })}
                                      </tr>

                                      {/* Score Row */}
                                      <tr>
                                        <td className='py-1 px-1 md:px-2 font-medium text-gray-900 border-r'>
                                          Score
                                        </td>
                                        {Array.from(
                                          { length: 18 },
                                          (_, i) => i + 1,
                                        ).map((hole) => {
                                          const holeScore = item.scores.find(
                                            (s: any) => s.hole_number === hole,
                                          );
                                          const holePar =
                                            tournamentDetails?.course_pars[
                                              hole.toString()
                                            ];
                                          const relativeScore = holeScore
                                            ? holeScore.strokes - holePar
                                            : null;

                                          return (
                                            <td
                                              key={hole}
                                              className={`py-1 px-1 md:px-2 text-center border-r ${holeScore ? getScoreColorClass(relativeScore as number) : 'text-gray-400'}`}
                                            >
                                              {holeScore
                                                ? holeScore.strokes
                                                : '–'}
                                            </td>
                                          );
                                        })}
                                      </tr>

                                      {/* Drive Row */}
                                      <tr>
                                        <td className='py-1 px-1 md:px-2 font-medium text-gray-900 border-r'>
                                          Drive
                                        </td>
                                        {Array.from(
                                          { length: 18 },
                                          (_, i) => i + 1,
                                        ).map((hole) => {
                                          const holeScore = item.scores.find(
                                            (s: any) => s.hole_number === hole,
                                          );
                                          const driverInitial = holeScore
                                            ?.drive_player?.name
                                            ? holeScore.drive_player.name.charAt(
                                                0,
                                              )
                                            : '–';

                                          return (
                                            <td
                                              key={hole}
                                              className='py-1 px-1 md:px-2 text-center text-gray-800 border-r'
                                            >
                                              {driverInitial}
                                            </td>
                                          );
                                        })}
                                      </tr>

                                      {/* Mulligan Row */}
                                      <tr>
                                        <td className='py-1 px-1 md:px-2 font-medium text-gray-900 border-r'>
                                          Mulligan
                                        </td>
                                        {Array.from(
                                          { length: 18 },
                                          (_, i) => i + 1,
                                        ).map((hole) => {
                                          const holeScore = item.scores.find(
                                            (s: any) => s.hole_number === hole,
                                          );
                                          const mulliganInitial = holeScore
                                            ?.mulligan_player?.name
                                            ? holeScore.mulligan_player.name.charAt(
                                                0,
                                              )
                                            : '–';

                                          return (
                                            <td
                                              key={hole}
                                              className={`py-1 px-1 md:px-2 text-center border-r ${holeScore?.mulligan_player ? 'text-orange-500 font-medium' : 'text-gray-400'}`}
                                            >
                                              {mulliganInitial}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Refresh Controls - MOVED HERE & MODIFIED */}
                  <div className='flex justify-end items-center mt-4 space-x-2 px-1'>
                    <span className='text-xs text-gray-500 flex items-center'>
                      Last updated: {lastUpdateTime}
                      {isUpdating && (
                        <svg
                          className='animate-spin ml-2 h-4 w-4 text-gray-500'
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                        >
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                          ></circle>
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                          ></path>
                        </svg>
                      )}
                    </span>
                    <div className='flex space-x-1'>
                      <button
                        onClick={() =>
                          fetchLeaderboardData(type as TournamentType, false)
                        }
                        className='text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded'
                        disabled={isUpdating}
                      >
                        Refresh
                      </button>
                      {/* Full Refresh Button Removed */}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'scoreInput' && (
                <motion.div
                  key='scoreInput'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className='bg-white shadow-md rounded-lg p-2 md:p-4'
                >
                  {/* Removed Duplicate Score Input Header */}

                  {/* Team Selection */}
                  {!selectedTeam ? (
                    <div className='mb-6'>
                      <h2 className='text-xl md:text-2xl font-semibold text-center mb-4 text-primary'>
                        Score Input
                      </h2>
                      <p className='text-center text-gray-600 mb-4 text-sm md:text-base'>
                        Select your team to begin entering scores.
                      </p>

                      <div className='max-w-sm mx-auto'>
                        <label
                          htmlFor='team-select'
                          className='block text-base md:text-lg font-medium text-gray-700 mb-2 text-center'
                        >
                          Select Your Team
                        </label>
                        <div className='relative'>
                          <select
                            id='team-select'
                            value={selectedTeam}
                            onChange={(e) => setSelectedTeam(e.target.value)}
                            className='block w-full pl-3 pr-8 py-2 text-sm md:text-base border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary rounded-lg shadow-sm appearance-none bg-white'
                          >
                            <option value=''>-- Choose a team --</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                          <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
                            <svg
                              className='h-4 w-4 md:h-5 md:w-5'
                              xmlns='http://www.w3.org/2000/svg'
                              viewBox='0 0 20 20'
                              fill='currentColor'
                              aria-hidden='true'
                            >
                              <path
                                fillRule='evenodd'
                                d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                                clipRule='evenodd'
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Original Score Input Form (if toggled) */}
                      {showOriginalScoreInput ? (
                        <ScoreInputForm
                          key={selectedTeam}
                          teamId={selectedTeam}
                          tournamentType={type as TournamentType}
                          minDrivesPerPlayer={getMinDrivesPerPlayer()}
                          coursePars={tournamentDetails?.course_pars}
                          playerMap={memoizedPlayerMap}
                        />
                      ) : (
                        <div className='bg-gray-50 p-2 md:p-4 rounded-lg'>
                          {/* Header section for selected team - Reduced padding & Repositioned Button */}
                          <div className='mb-4'>
                            <div className='flex flex-col sm:flex-row justify-between items-start mb-1'>
                              {/* Team Name & Score Info */}
                              <div className='mb-2 sm:mb-0'>
                                <p className='text-gray-600 text-base md:text-lg'>
                                  Scores for:{' '}
                                  <span className='font-bold'>
                                    {
                                      teams.find((t) => t.id === selectedTeam)
                                        ?.name
                                    }
                                  </span>
                                </p>
                              </div>
                              {/* Removed Original UI Button */}
                            </div>
                            {/* Moved Change Team Button Here */}
                            <button
                              onClick={() => setSelectedTeam('')}
                              className='text-xs md:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded-lg shadow-sm mt-1'
                            >
                              Change Team
                            </button>
                          </div>

                          {/* Combined Player Stats Summary Component */}
                          {(() => {
                            // Show loading state while fetching players
                            if (isLoadingPlayers) {
                              return (
                                <div className='bg-white p-3 rounded-lg shadow-sm mb-4 text-center text-gray-500'>
                                  Loading player stats...
                                </div>
                              );
                            }

                            // Ensure we have the fetched players for the selected team
                            if (
                              !selectedTeamPlayers ||
                              selectedTeamPlayers.length === 0
                            ) {
                              // This case should be less common now, but handle it.
                              // Could display an error or minimal info if needed.
                              return (
                                <div className='bg-white p-3 rounded-lg shadow-sm mb-4 text-center text-red-500'>
                                  Could not load player stats for this team.
                                </div>
                              );
                            }

                            // Find optional dynamic data from leaderboard
                            const teamData = leaderboardData?.leaderboard?.find(
                              (item: any) => item.team.id === selectedTeam,
                            );

                            // Determine score and mulligans with defaults
                            const relativeToPar = teamData?.relativeToPar ?? 0; // Default to 0 (E)
                            const defaultMulligans =
                              tournamentDetails?.mulligans_allowed ?? 0;

                            // Build display list from selectedTeamPlayers, merging leaderboard data
                            const playersToDisplay = selectedTeamPlayers.map(
                              (player: any) => {
                                const driveInfo = teamData?.driveCounts?.find(
                                  (dc: any) => dc.id === player.id,
                                );
                                const mulliganInfo =
                                  teamData?.mulliganCounts?.find(
                                    (mc: any) => mc.id === player.id,
                                  );

                                return {
                                  id: player.id,
                                  name: player.name,
                                  initials:
                                    player.name?.substring(0, 2) || '??',
                                  drives: driveInfo?.count ?? 0, // Default to 0 drives
                                  mulligans:
                                    mulliganInfo?.remaining ?? defaultMulligans, // Default to max mulligans
                                };
                              },
                            );

                            // Render the component using playersToDisplay
                            return (
                              <div className='bg-white p-3 rounded-lg shadow-sm mb-4'>
                                <div className='flex justify-around items-start text-center'>
                                  {/* Score Section */}
                                  <div className='flex flex-col items-center w-1/3'>
                                    <span className='text-xs text-gray-500 uppercase font-medium mb-1'>
                                      Score
                                    </span>
                                    <span
                                      className={`text-2xl font-bold ${getScoreColorClass(relativeToPar)}`}
                                    >
                                      {formatRelativeToPar(relativeToPar)}
                                    </span>
                                  </div>

                                  {/* Drives Section */}
                                  <div className='flex flex-col items-center w-1/3 border-l border-gray-200 px-2'>
                                    <span className='text-xs text-gray-500 uppercase font-medium mb-1'>
                                      Drives Used
                                    </span>
                                    <div className='flex justify-center space-x-4 text-xs text-gray-700 mb-1'>
                                      {playersToDisplay.map((p: any) => (
                                        <span key={p.id}>{p.initials}</span>
                                      ))}
                                    </div>
                                    <div className='flex justify-center space-x-4 text-lg font-semibold'>
                                      {playersToDisplay.map((p: any) => (
                                        <span key={p.id}>{p.drives}</span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Mulligans Section */}
                                  <div className='flex flex-col items-center w-1/3 border-l border-gray-200 px-2'>
                                    <span className='text-xs text-gray-500 uppercase font-medium mb-1'>
                                      Mulleys
                                    </span>
                                    <div className='flex justify-center space-x-4 text-xs text-gray-700 mb-1'>
                                      {playersToDisplay.map((p: any) => (
                                        <span key={p.id}>{p.initials}</span>
                                      ))}
                                    </div>
                                    <div className='flex justify-center space-x-4 text-lg font-semibold'>
                                      {playersToDisplay.map((p: any) => (
                                        <span key={p.id}>{p.mulligans}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Keep Custom CSS for global styles (like player colors, etc.) */}
                          <style jsx global>{`
                            /* Hide the Status column */
                            .score-input-wrapper th:nth-child(6),
                            .score-input-wrapper td:nth-child(6) {
                              display: none !important;
                            }
                            /* Hide original Drive Counts */
                            .score-input-wrapper
                              [data-testid='drive-counts-section'] {
                              display: none !important;
                            }
                            /* Cell Padding */
                            .score-input-wrapper th,
                            .score-input-wrapper td {
                              padding: 0.375rem 0.375rem !important;
                            }
                            .score-input-wrapper th:first-child,
                            .score-input-wrapper td:first-child {
                              padding-left: 0.5rem !important;
                            }
                            /* Input base style */
                            .score-input-wrapper input[type='number'] {
                              transition: background-color 0.2s ease;
                              padding: 0.25rem !important;
                              font-size: 0.875rem !important;
                              text-align: center;
                              border-radius: 0.375rem;
                            }
                            /* Score Colors */
                            .score-input-wrapper .score-eagle {
                              background-color: #a7f3d0 !important; /* Tailwind green-200 */
                              color: #065f46 !important; /* Tailwind green-800 */
                              font-weight: 700; /* Bold */
                              border: 1px solid #065f46 !important; /* Add border */
                            }
                            .score-input-wrapper .score-birdie {
                              background-color: #d1fae5 !important; /* Tailwind green-100 */
                              color: #047857 !important; /* Tailwind green-700 */
                              font-weight: 600;
                            }
                            .score-input-wrapper .score-equal-par {
                              background-color: #f3f4f6 !important; /* Tailwind gray-100 */
                              color: #1f2937 !important; /* Tailwind gray-800 */
                            }
                            .score-input-wrapper .score-bogey {
                              background-color: #fee2e2 !important; /* Tailwind red-100 */
                              color: #b91c1c !important; /* Tailwind red-700 */
                              font-weight: 600;
                            }
                            .score-input-wrapper .score-double-bogey-plus {
                              background-color: #fecaca !important; /* Tailwind red-200 */
                              color: #991b1b !important; /* Tailwind red-800 */
                              font-weight: 700; /* Bold */
                              border: 1px solid #991b1b !important; /* Add border */
                            }
                            /* Select base style */
                            .score-input-wrapper select {
                              padding: 0.25rem 0.5rem !important;
                              font-size: 0.875rem !important;
                              transition: background-color 0.2s ease;
                            }
                            /* Player Select Colors */
                            .score-input-wrapper .player1-selected {
                              background-color: #dbeafe !important;
                              color: #1e40af !important;
                              font-weight: 600;
                            }
                            .score-input-wrapper .player2-selected {
                              background-color: #fef3c7 !important;
                              color: #92400e !important;
                              font-weight: 600;
                            }
                            /* Current Score (in header) */
                            .current-score {
                              font-size: 1.125rem;
                              font-weight: 600;
                              margin-top: 0.25rem;
                              display: flex;
                              align-items: center;
                              gap: 0.5rem;
                            }
                            .score-value {
                              padding: 0.125rem 0.5rem;
                              border-radius: 0.375rem;
                              font-size: 1.125rem;
                            }
                            .score-value.negative {
                              background-color: #d1fae5;
                              color: #065f46;
                            }
                            .score-value.positive {
                              background-color: #fee2e2;
                              color: #b91c1c;
                            }
                            .score-value.even {
                              background-color: #f3f4f6;
                              color: #1f2937;
                            }
                          `}</style>

                          {/* ScoreInputForm Wrapper */}
                          <div className='score-input-wrapper overflow-x-auto'>
                            <ScoreInputForm
                              key={selectedTeam}
                              teamId={selectedTeam}
                              tournamentType={type as TournamentType}
                              minDrivesPerPlayer={getMinDrivesPerPlayer()}
                              coursePars={tournamentDetails?.course_pars}
                              playerMap={memoizedPlayerMap}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Real-time notifications */}
      <RealtimeNotification
        isVisible={notification.isVisible}
        teamName={notification.teamName}
        timestamp={notification.timestamp}
        onDismiss={dismissNotification}
      />
    </Layout>
  );
}
