import { Edit, Mail, Plus, Save, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';

interface Player {
  id: number;
  name: string;
  email: string;
  handicap: number;
  mulligansLeft: number;
}
interface Team {
  id: number;
  name: string;
  players: Player[];
  handicap: number;
}
export function AdminTeamsManager() {
  // console.log('Rendering AdminTeamsManager component'); // REMOVE

  // Mock data for teams - replace with API data fetching
  const [teams, setTeams] = useState<Team[]>([
    {
      id: 1,
      name: 'Team Alpha',
      handicap: 5,
      players: [
        {
          id: 1,
          name: 'John Smith',
          email: 'john@example.com',
          handicap: 3,
          mulligansLeft: 3,
        },
        {
          id: 2,
          name: 'Jane Doe',
          email: 'jane@example.com',
          handicap: 2,
          mulligansLeft: 3,
        },
      ],
    },
    {
      id: 2,
      name: 'Team Beta',
      handicap: 7,
      players: [
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike@example.com',
          handicap: 4,
          mulligansLeft: 3,
        },
        {
          id: 4,
          name: 'Sarah Williams',
          email: 'sarah@example.com',
          handicap: 3,
          mulligansLeft: 3,
        },
      ],
    },
  ]);
  // State for controlling the visibility and data of the 'Add New Team' form
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    handicap: 0,
    players: [
      {
        name: '',
        email: '',
        handicap: 0,
        mulligansLeft: 3,
      },
      {
        name: '',
        email: '',
        handicap: 0,
        mulligansLeft: 3,
      },
    ],
  });
  // State for controlling the visibility and data of the 'Edit Team' form
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  // Generic handler for top-level fields in the new team form (name, handicap)
  const handleNewTeamChange = (field: string, value: string | number) => {
    setNewTeam({
      ...newTeam,
      [field]: value,
    });
  };
  // Handler for nested player fields within the new team form
  const handleNewPlayerChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const updatedPlayers = [...newTeam.players];
    updatedPlayers[index] = {
      ...updatedPlayers[index],
      [field]: value,
    };
    setNewTeam({
      ...newTeam,
      players: updatedPlayers,
    });
  };
  // Generic handler for top-level fields in the editing team form
  const handleEditTeamChange = (field: string, value: string | number) => {
    if (!editingTeam) return;
    setEditingTeam({
      ...editingTeam,
      [field]: value,
    });
  };
  // Handler for nested player fields within the editing team form
  const handleEditPlayerChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    if (!editingTeam) return;
    const updatedPlayers = [...editingTeam.players];
    updatedPlayers[index] = {
      ...updatedPlayers[index],
      [field]: value,
    };
    setEditingTeam({
      ...editingTeam,
      players: updatedPlayers,
    });
  };
  // Adds the team from the newTeam state to the main teams list
  const handleAddTeam = () => {
    // Validate form
    if (!newTeam.name.trim()) {
      alert('Team name is required');
      return;
    }
    if (
      newTeam.players.some(
        (player) => !player.name.trim() || !player.email.trim(),
      )
    ) {
      alert('Player name and email are required');
      return;
    }
    // Create new team with ID, and add IDs to players
    const teamWithPlayerIds: Team = {
      id: Date.now(), // Team ID
      name: newTeam.name,
      handicap: newTeam.handicap,
      players: newTeam.players.map((player) => ({
        ...player,
        id: Date.now() + Math.random(), // Simple unique ID for player
      })),
    };
    // Add to teams
    setTeams([...teams, teamWithPlayerIds]);
    // Reset form
    setNewTeam({
      name: '',
      handicap: 0,
      players: [
        {
          name: '',
          email: '',
          handicap: 0,
          mulligansLeft: 3,
        },
        {
          name: '',
          email: '',
          handicap: 0,
          mulligansLeft: 3,
        },
      ],
    });
    setIsAddingTeam(false);
  };
  // Sets the component into editing mode for a specific team
  const handleEditStart = (team: Team) => {
    setEditingTeamId(team.id);
    setEditingTeam({
      ...team,
    });
  };
  // Saves the changes from the editingTeam state back to the main teams list
  const handleSaveEdit = () => {
    if (!editingTeam) return;
    // Validate form
    if (!editingTeam.name.trim()) {
      alert('Team name is required');
      return;
    }
    if (
      editingTeam.players.some(
        (player) => !player.name.trim() || !player.email.trim(),
      )
    ) {
      alert('Player name and email are required');
      return;
    }
    // Update team in array
    setTeams(
      teams.map((team) => (team.id === editingTeam.id ? editingTeam : team)),
    );
    // Reset editing state
    setEditingTeamId(null);
    setEditingTeam(null);
  };
  // Resets the editing state without saving changes
  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setEditingTeam(null);
  };
  // Removes a team from the list after confirmation
  const handleDeleteTeam = (teamId: number) => {
    if (confirm('Are you sure you want to delete this team?')) {
      setTeams(teams.filter((team) => team.id !== teamId));
    }
  };
  // Placeholder for sending player invitation emails (future API call)
  const handleSendInvitation = (email: string) => {
    alert(`Invitation sent to ${email}`);
    // In a real app, this would send an API request
  };
  return (
    <div className='max-w-5xl mx-auto'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold text-[#0B3D2E]'>Teams</h2>
        <button
          onClick={() => setIsAddingTeam(true)}
          className='flex items-center bg-[#0B3D2E] text-white px-4 py-2 rounded-md hover:bg-[#0a3528] transition-colors'
          disabled={isAddingTeam}
        >
          <Plus size={18} className='mr-2' />
          Add Team
        </button>
      </div>
      {/* New Team Form */}
      {isAddingTeam && (
        <div className='bg-white rounded-lg shadow-md mb-6 p-6'>
          <h3 className='text-xl font-bold mb-4'>Add New Team</h3>
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Team Name
            </label>
            <input
              type='text'
              value={newTeam.name}
              onChange={(e) => handleNewTeamChange('name', e.target.value)}
              className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
              placeholder='Enter team name'
            />
          </div>
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Team Handicap
            </label>
            <input
              type='number'
              value={newTeam.handicap}
              onChange={(e) =>
                handleNewTeamChange('handicap', parseInt(e.target.value) || 0)
              }
              className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
              placeholder='Enter team handicap'
            />
          </div>
          <div className='mb-6'>
            <h4 className='text-lg font-medium mb-2'>Players</h4>
            {newTeam.players.map((player, index) => (
              <div key={index} className='bg-gray-50 p-4 rounded-md mb-3'>
                <h5 className='font-medium mb-2'>Player {index + 1}</h5>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-2'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Name
                    </label>
                    <input
                      type='text'
                      value={player.name}
                      onChange={(e) =>
                        handleNewPlayerChange(index, 'name', e.target.value)
                      }
                      className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                      placeholder='Enter player name'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Email
                    </label>
                    <input
                      type='email'
                      value={player.email}
                      onChange={(e) =>
                        handleNewPlayerChange(index, 'email', e.target.value)
                      }
                      className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                      placeholder='Enter player email'
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Individual Handicap
                  </label>
                  <input
                    type='number'
                    value={player.handicap}
                    onChange={(e) =>
                      handleNewPlayerChange(
                        index,
                        'handicap',
                        parseInt(e.target.value) || 0,
                      )
                    }
                    className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                    placeholder='Enter player handicap'
                  />
                </div>
              </div>
            ))}
          </div>
          <div className='flex justify-end space-x-3'>
            <button
              onClick={() => setIsAddingTeam(false)}
              className='px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleAddTeam}
              className='bg-[#0B3D2E] text-white px-4 py-2 rounded-md hover:bg-[#0a3528] transition-colors'
            >
              Add Team
            </button>
          </div>
        </div>
      )}
      {/* Teams List */}
      <div className='space-y-4'>
        {teams.length === 0 ? (
          <div className='bg-white rounded-lg shadow-md p-6 text-center text-gray-500'>
            No teams added yet. Click "Add Team" to create a new team.
          </div>
        ) : (
          teams.map((team) => (
            <div
              key={team.id}
              className='bg-white rounded-lg shadow-md overflow-hidden'
            >
              {editingTeamId === team.id ? (
                // Editing mode
                <div className='p-6'>
                  <div className='mb-4'>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Team Name
                    </label>
                    <input
                      type='text'
                      value={editingTeam?.name}
                      onChange={(e) =>
                        handleEditTeamChange('name', e.target.value)
                      }
                      className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                    />
                  </div>
                  <div className='mb-4'>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Team Handicap
                    </label>
                    <input
                      type='number'
                      value={editingTeam?.handicap}
                      onChange={(e) =>
                        handleEditTeamChange(
                          'handicap',
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                    />
                  </div>
                  <div className='mb-6'>
                    <h4 className='text-lg font-medium mb-2'>Players</h4>
                    {editingTeam?.players.map((player, index) => (
                      <div
                        key={index}
                        className='bg-gray-50 p-4 rounded-md mb-3'
                      >
                        <h5 className='font-medium mb-2'>Player {index + 1}</h5>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-2'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Name
                            </label>
                            <input
                              type='text'
                              value={player.name}
                              onChange={(e) =>
                                handleEditPlayerChange(
                                  index,
                                  'name',
                                  e.target.value,
                                )
                              }
                              className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Email
                            </label>
                            <input
                              type='email'
                              value={player.email}
                              onChange={(e) =>
                                handleEditPlayerChange(
                                  index,
                                  'email',
                                  e.target.value,
                                )
                              }
                              className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                            />
                          </div>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Individual Handicap
                            </label>
                            <input
                              type='number'
                              value={player.handicap}
                              onChange={(e) =>
                                handleEditPlayerChange(
                                  index,
                                  'handicap',
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Mulligans Left
                            </label>
                            <input
                              type='number'
                              value={player.mulligansLeft}
                              onChange={(e) =>
                                handleEditPlayerChange(
                                  index,
                                  'mulligansLeft',
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className='flex justify-end space-x-3'>
                    <button
                      onClick={handleCancelEdit}
                      className='flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
                    >
                      <X size={18} className='mr-2' />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className='flex items-center bg-[#0B3D2E] text-white px-4 py-2 rounded-md hover:bg-[#0a3528] transition-colors'
                    >
                      <Save size={18} className='mr-2' />
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <div className='bg-[#0B3D2E] text-white px-6 py-4 flex justify-between items-center'>
                    <h3 className='text-xl font-bold'>{team.name}</h3>
                    <div className='text-sm'>
                      Team Handicap: {team.handicap}
                    </div>
                  </div>
                  <div className='p-6'>
                    <h4 className='text-lg font-medium mb-3'>Players</h4>
                    <div className='space-y-3'>
                      {team.players.map((player) => (
                        <div
                          key={player.id}
                          className='bg-gray-50 p-4 rounded-md flex flex-col md:flex-row md:justify-between md:items-center'
                        >
                          <div className='mb-2 md:mb-0'>
                            <div className='font-medium'>{player.name}</div>
                            <div className='text-sm text-gray-600'>
                              {player.email}
                            </div>
                          </div>
                          <div className='flex flex-col md:flex-row gap-2 md:items-center'>
                            <div className='text-sm bg-gray-200 px-3 py-1 rounded-full'>
                              Handicap: {player.handicap}
                            </div>
                            <div className='text-sm bg-gray-200 px-3 py-1 rounded-full'>
                              Mulligans: {player.mulligansLeft}
                            </div>
                            <button
                              onClick={() => handleSendInvitation(player.email)}
                              className='flex items-center text-sm text-[#0B3D2E] hover:text-[#0a3528]'
                            >
                              <Mail size={16} className='mr-1' />
                              Invite
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className='flex justify-end space-x-3 mt-4'>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className='flex items-center text-red-600 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
                      >
                        <Trash2 size={18} className='mr-2' />
                        Delete
                      </button>
                      <button
                        onClick={() => handleEditStart(team)}
                        className='flex items-center bg-[#0B3D2E] text-white px-4 py-2 rounded-md hover:bg-[#0a3528] transition-colors'
                      >
                        <Edit size={18} className='mr-2' />
                        Edit
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
