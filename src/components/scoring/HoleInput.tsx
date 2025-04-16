import React from 'react';
interface Player {
  id: number;
  name: string;
  mulligansLeft: number;
}
interface HoleInputProps {
  holeNumber: number;
  par: number;
  players: Player[];
  strokes: number | null;
  selectedDrive: number | null;
  selectedMulligan: number | null;
  availableMulligans: Record<number, number>;
  onChange: (holeNumber: number, field: string, value: number | null) => void;
}
export function HoleInput({
  holeNumber,
  par,
  players,
  strokes,
  selectedDrive,
  selectedMulligan,
  availableMulligans,
  onChange,
}: HoleInputProps) {
  return (
    <div className='grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-100'>
      <div className='col-span-1 font-medium'>{holeNumber}</div>
      <div className='col-span-1 text-gray-600'>Par {par}</div>
      {/* Strokes input */}
      <div className='col-span-2'>
        <input
          type='number'
          min='1'
          max='12'
          value={strokes === null ? '' : strokes}
          onChange={(e) =>
            onChange(
              holeNumber,
              'strokes',
              e.target.value ? Number(e.target.value) : null,
            )
          }
          className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]'
          placeholder='Score'
        />
      </div>
      {/* Drive selection */}
      <div className='col-span-4'>
        <label className='block text-xs text-gray-500 mb-1'>Drive</label>
        <div className='flex'>
          {players.map((player) => (
            <button
              key={player.id}
              type='button'
              onClick={() => onChange(holeNumber, 'drive', player.id)}
              className={`flex-1 px-3 py-2 text-sm border ${selectedDrive === player.id ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} ${player.id === players[0].id ? 'rounded-l' : 'rounded-r'}`}
            >
              {player.name}
            </button>
          ))}
        </div>
      </div>
      {/* Mulligan selection */}
      <div className='col-span-4'>
        <label className='block text-xs text-gray-500 mb-1'>Mulligan</label>
        <div className='flex'>
          <button
            type='button'
            onClick={() => onChange(holeNumber, 'mulligan', null)}
            className={`flex-1 px-3 py-2 text-sm border ${selectedMulligan === null ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} rounded-l`}
          >
            None
          </button>
          {players.map((player) => (
            <button
              key={player.id}
              type='button'
              disabled={
                availableMulligans[player.id] <= 0 &&
                selectedMulligan !== player.id
              }
              onClick={() => onChange(holeNumber, 'mulligan', player.id)}
              className={`flex-1 px-3 py-2 text-sm border ${selectedMulligan === player.id ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]' : availableMulligans[player.id] <= 0 ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} ${player.id === players[players.length - 1].id ? 'rounded-r' : ''}`}
            >
              {player.name} ({availableMulligans[player.id]})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
