import React from 'react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-[#E0C58F] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-md rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-slate-800 font-heading mb-6">Terms of Service</h1>
        <div className="prose prose-lg text-slate-700 max-w-none">
          <p>Welcome to Katha AI. By using our services, you agree to these terms. Please read them carefully.</p>
          <h2 className="text-2xl font-semibold mt-6">1. Your Content</h2>
          <p>You retain ownership of all intellectual property rights in your content. When you upload, submit, store, send or receive content to or through our services, you give Katha AI a worldwide license to use, host, store, reproduce, modify, create derivative works, communicate, publish, publicly perform, publicly display and distribute such content.</p>
          <h2 className="text-2xl font-semibold mt-6">2. Prohibited Conduct</h2>
          <p>You agree not to misuse the Katha AI services or help anyone else to do so. This includes, but is not limited to, creating content that is unlawful, harmful, threatening, abusive, or otherwise objectionable.</p>
          <p>These terms are a placeholder and will be updated with our full legal terms.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
