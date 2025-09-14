import React from 'react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#E0C58F] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-md rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-slate-800 font-heading mb-6">Privacy Policy</h1>
        <div className="prose prose-lg text-slate-700 max-w-none">
          <p>Your privacy is important to us. This Privacy Policy explains how we collect, use, and share information about you when you use our services.</p>
          <h2 className="text-2xl font-semibold mt-6">Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, create content, or communicate with us. We also collect log information when you use our services, including your IP address, browser type, and usage details.</p>
          <h2 className="text-2xl font-semibold mt-6">How We Use Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, as well as to develop new ones. We may also use the information to communicate with you, including sending you technical notices, updates, and support messages.</p>
          <p>This policy is a placeholder and will be updated with our full privacy terms.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
