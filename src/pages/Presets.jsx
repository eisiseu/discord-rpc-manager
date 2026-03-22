import React from 'react';
import PresetGrid from '../components/Preset/PresetGrid';

export default function Presets() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">프리셋</h2>
        <p className="text-sm text-gray-500 mt-0.5">인기 앱 프리셋을 원클릭으로 추가하세요</p>
      </div>
      <PresetGrid />
    </div>
  );
}
