import React from 'react';

const Blog = () => {
  return (
    <div className="min-h-screen bg-[#E0C58F] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-md rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-slate-800 font-heading mb-6">Our Blog</h1>
        <div className="prose prose-lg text-slate-700 max-w-none">
          <p>Stay tuned for articles, tutorials, and insights on video creation, AI technology, and Nepali culture. Our blog is coming soon!</p>
          {/* Placeholder for blog posts */}
        </div>
      </div>
    </div>
  );
};

export default Blog;
