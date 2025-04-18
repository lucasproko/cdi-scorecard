import React, { useEffect, useState } from 'react';

interface RealtimeNotificationProps {
  isVisible: boolean;
  teamName?: string;
  timestamp?: string;
  onDismiss: () => void;
}

const RealtimeNotification: React.FC<RealtimeNotificationProps> = ({
  isVisible,
  teamName,
  timestamp,
  onDismiss,
}) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    // Show notification when isVisible becomes true
    if (isVisible) {
      setShow(true);

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!show) return null;

  return (
    <div className='fixed bottom-5 right-5 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-lg max-w-sm z-50 animate-fade-in'>
      <div className='flex justify-between items-start'>
        <div>
          <p className='font-bold'>New score update!</p>
          {teamName && (
            <p className='text-sm'>Team {teamName} has submitted new scores.</p>
          )}
          {timestamp && (
            <p className='text-xs text-blue-600 mt-1'>{timestamp}</p>
          )}
        </div>
        <button
          onClick={() => {
            setShow(false);
            onDismiss();
          }}
          className='text-blue-500 hover:text-blue-800'
        >
          <span className='text-xl'>&times;</span>
        </button>
      </div>
    </div>
  );
};

export default RealtimeNotification;
