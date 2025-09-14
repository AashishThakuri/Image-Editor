import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-[#E0C58F] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white/30 backdrop-blur-md rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-slate-800 font-heading mb-6">About Katha AI</h1>
        <div className="prose prose-lg text-slate-700 max-w-none">
          <p>Welcome to Katha AI, your creative partner for generating stunning videos with a Nepali touch. Our mission is to empower creators, marketers, and storytellers to produce high-quality, culturally rich video content effortlessly.</p>
          <p>Founded by a team of AI enthusiasts and filmmakers with deep roots in Nepal, we understand the importance of authentic storytelling. We built Katha AI to bridge the gap between advanced technology and local narratives, making it possible for anyone to create videos that resonate with the heart of Nepal.</p>
          <p>Our platform leverages cutting-edge AI to transform simple text prompts into cinematic masterpieces. Whether you're promoting a brand, creating educational content, or sharing a personal story, Katha AI provides the tools you need to bring your vision to life. Join us on this journey to celebrate and share the vibrant culture of Nepal with the world.</p>
        </div>
      </div>
    </div>
  );
};

export default About;
