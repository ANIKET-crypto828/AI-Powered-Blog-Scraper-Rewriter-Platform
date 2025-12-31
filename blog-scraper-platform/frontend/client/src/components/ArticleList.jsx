import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, RefreshCw, Filter, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-powered-blog-scraper-rewriter-platform.onrender.com/api';

function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, [filter]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const typeParam = filter !== 'all' ? `?type=${filter}` : '';
      const { data } = await axios.get(`${API_URL}/articles${typeParam}`);
      
      setArticles(data.data || []);
    } catch (err) {
      setError('Failed to load articles. Please check your connection.');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyles = (type) => {
    return type === 'updated' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getBadgeIcon = (type) => {
    return type === 'updated' ? CheckCircle : Clock;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg text-gray-600">Loading articles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          All Articles
        </h2>
        <p className="text-gray-600">
          Browse original and AI-enhanced articles from BeyondChats blog
        </p>
      </div>

      {/* Filter Section */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['all', 'original', 'updated'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === type
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="flex items-center ml-auto">
          <span className="text-sm text-gray-500">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'} found
          </span>
          <button
            onClick={fetchArticles}
            className="ml-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
          <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No articles found
          </h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? 'Run the scraper to fetch articles from BeyondChats'
              : `No ${filter} articles available`
            }
          </p>
          <button
            onClick={() => setFilter('all')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View All Articles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => {
            const BadgeIcon = getBadgeIcon(article.type);
            
            return (
              <Link
                key={article._id}
                to={`/article/${article._id}`}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 group flex flex-col"
              >
                {/* Card Header */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getBadgeStyles(article.type)}`}>
                      <BadgeIcon className="w-3 h-3 mr-1" />
                      {article.type.toUpperCase()}
                    </span>
                    {article.references && article.references.length > 0 && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {article.references.length} refs
                      </span>
                    )}
                  </div>
                  
                  {/* Article Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition line-clamp-2 flex-1">
                    {article.title}
                  </h3>
                  
                  {/* Article Excerpt */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {truncateText(article.content, 150)}
                  </p>
                  
                  {/* Card Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(article.createdAt)}
                    </span>
                    <ExternalLink className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      
      {/* Statistics Footer */}
      {articles.length > 0 && (
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {articles.filter(a => a.type === 'original').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Original Articles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {articles.filter(a => a.type === 'updated').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">AI-Enhanced Articles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {articles.reduce((acc, a) => acc + (a.references?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total References</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticleList;