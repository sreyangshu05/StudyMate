import React, { useState, useEffect } from 'react';
import { Play, ExternalLink, Clock, Eye } from 'lucide-react';
import { youtubeAPI } from '../services/api';

const YouTubeRecommender = ({ topic, maxResults = 5 }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (topic) {
      fetchRecommendations();
    }
  }, [topic]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await youtubeAPI.getRecommendations(topic, maxResults);
      setRecommendations(response.data.recommendations);
    } catch (err) {
      setError('Failed to fetch recommendations');
      console.error('YouTube API error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration) => {
    // Convert PT15M30S to 15:30
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count) => {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (!topic) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">YouTube Recommendations</h3>
        <div className="text-center text-gray-500">
          <Play className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Select a topic to get video recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            YouTube Recommendations
          </h3>
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Educational videos about: <span className="font-medium">{topic}</span>
        </p>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="w-32 h-20 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={fetchRecommendations}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Try again
            </button>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center text-gray-500">
            <Play className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recommendations found for this topic</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((video, index) => (
              <div
                key={video.videoId}
                className="flex space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-32 h-20 object-cover rounded"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/128x80?text=Video';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {video.title}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">{video.channelTitle}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {video.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(video.duration)}
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {formatViewCount(video.viewCount)} views
                    </div>
                    <div>
                      {new Date(video.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Watch
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeRecommender;
