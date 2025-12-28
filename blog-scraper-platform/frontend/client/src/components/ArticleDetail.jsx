// src/components/ArticleDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar, RefreshCw, Link2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`${API_URL}/articles/${id}`);
      setArticle(data.data);
    } catch (err) {
      setError('Failed to load article');
      console.error('Error fetching article:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error || 'Article not found'}
        </div>
        <Link to="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          ← Back to articles
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Button */}
      <Link 
        to="/" 
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Articles
      </Link>

      {/* Article Header */}
      <article className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              article.type === 'updated'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {article.type.toUpperCase()}
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(article.createdAt)}
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>

          {article.sourceUrl && (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View Original Source
            </a>
          )}
        </div>

        {/* Article Content */}
        <div className="p-8">
          <div className="prose prose-lg max-w-none">
            {article.content.split('\n\n').map((paragraph, idx) => {
              // Check if it's a heading
              if (paragraph.startsWith('##')) {
                return (
                  <h2 key={idx} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                    {paragraph.replace(/^##\s*/, '')}
                  </h2>
                );
              }
              
              return (
                <p key={idx} className="text-gray-700 mb-4 leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>

        {/* References Section */}
        {article.references && article.references.length > 0 && (
          <div className="p-8 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <Link2 className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">
                References
              </h3>
            </div>
            <ul className="space-y-2">
              {article.references.map((ref, idx) => (
                <li key={idx}>
                  <a
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 hover:underline flex items-start"
                  >
                    <span className="font-semibold mr-2">{idx + 1}.</span>
                    <span className="break-all">{ref}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  );
}

export default ArticleDetail;