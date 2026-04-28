"use client";

import { useRive } from '@rive-app/react-canvas';

export default function RiveTester() {
  const { RiveComponent } = useRive({
    src: '/rive/vehicles.riv',
    autoplay: true,
  });

  return (
    <div style={{ width: '100%', height: '400px' }} className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200 mt-8 mb-8">
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
