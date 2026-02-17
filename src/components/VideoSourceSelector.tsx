import { useState, useEffect } from 'react';
import { videoSources, type VideoSource } from '@/types/videoSources';
import { Loader2 } from 'lucide-react';

interface VideoSourceSelectorProps {
  selectedSource: VideoSource;
  onSourceChange: (source: VideoSource) => void;
}

export const VideoSourceSelector = ({ selectedSource, onSourceChange }: VideoSourceSelectorProps) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, 'checking' | 'ready' | 'idle'>>({});

  useEffect(() => {
    // Start loading sources sequentially
    videoSources.forEach((source, index) => {
      setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, [source.id]: 'checking' }));
        
        setTimeout(() => {
          setLoadingStates(prev => ({ ...prev, [source.id]: 'ready' }));
        }, 1500);
      }, index * 300);
    });
  }, []);

  return (
    <div className="py-8">
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-2">Video Sources</h3>
          <p className="text-sm text-white/60">Select your preferred streaming source</p>
        </div>

        <div className="space-y-4">
          {videoSources.map((source) => {
            const state = loadingStates[source.id] || 'idle';
            const isSelected = selectedSource.id === source.id;
            
            return (
              <div
                key={source.id}
                className={`flex items-center gap-4 transition-all duration-300 ${
                  state === 'idle' ? 'opacity-20' : 'opacity-100'
                }`}
              >
                {/* Status Circle */}
                <div className="flex-shrink-0 w-7">
                  {state === 'checking' ? (
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  ) : state === 'ready' ? (
                    <button
                      onClick={() => onSourceChange(source)}
                      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {isSelected && (
                        <div className="h-3 w-3 rounded-full bg-white" />
                      )}
                    </button>
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-gray-800" />
                  )}
                </div>

                {/* Source Name & Fire */}
                <button
                  onClick={() => state === 'ready' && onSourceChange(source)}
                  disabled={state !== 'ready'}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <span className={`text-base font-medium transition-colors ${
                    state === 'ready' 
                      ? isSelected 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-700'
                  }`}>
                    {source.name}
                  </span>
                  {state === 'ready' && <span className="text-lg">🔥</span>}
                </button>
              </div>
            );
          })}
        </div>

        {/* Only show "Checking" message on the first loading item */}
        {videoSources.some(s => loadingStates[s.id] === 'checking') && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Checking for videos...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};