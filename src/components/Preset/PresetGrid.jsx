import React, { useState } from 'react';
import PresetCard from './PresetCard';
import defaultPresets, { presetCategories } from '../../data/defaultPresets';
import useLangStore from '../../store/langStore';

export default function PresetGrid() {
  const { t } = useLangStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = defaultPresets.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input
          className="input-field max-w-xs"
          placeholder={t.presets.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={selectedCategory === 'all' ? 'btn-primary text-xs px-3 py-1.5' : 'btn-ghost text-xs px-3 py-1.5'}
          >
            {t.presets.all}
          </button>
          {presetCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? 'btn-primary text-xs px-3 py-1.5' : 'btn-ghost text-xs px-3 py-1.5'}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((preset) => (
          <PresetCard key={preset.name} preset={preset} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">{t.presets.noResults}</div>
      )}
    </div>
  );
}
