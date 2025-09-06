"use client";
import React, { useState, useEffect } from 'react';
import { Shield, MapPin, Route, Users, Brain, TrendingUp, ChevronRight, Play, Building, Award, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CitySafeAILanding() {
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [visibleElements, setVisibleElements] = useState(new Set());
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    // Observe all sections and animated elements
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI Crime Prediction",
      description: "Advanced machine learning algorithms analyze historical data to predict crime patterns with 94% accuracy, enabling proactive law enforcement strategies",
      gradient: "from-blue-600 to-blue-800"
    },
    {
      icon: MapPin,
      title: "Smart Patrol Deployment",
      description: "Optimize police patrol routes and resource allocation based on real-time risk assessments and community needs",
      gradient: "from-emerald-600 to-emerald-800"
    },
    {
      icon: Route,
      title: "Citizen Safety Guidance",
      description: "Provide residents with real-time safe route recommendations and community safety alerts through mobile applications",
      gradient: "from-amber-600 to-amber-800"
    }
  ];

  const stats = [
    { number: "94%", label: "Prediction Accuracy" },
    { number: "40%", label: "Response Time Improvement" },
    { number: "250K+", label: "Citizens Served" },
    { number: "50+", label: "Partner Cities" }
  ];

  const handleCitizenPortalClick = () => {
    router.push('/public-login');
  };

  const handleLawEnforcementPortalClick = () => {
    router.push('/police-login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 overflow-hidden">
      {/* Government Seal Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32">
          <Building className="w-full h-full text-blue-600" />
        </div>
        <div className="absolute top-20 right-20 w-24 h-24">
          <Award className="w-full h-full text-emerald-600" />
        </div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28">
          <Globe className="w-full h-full text-amber-600" />
        </div>
        <div className="absolute bottom-32 right-1/3 w-20 h-20">
          <Shield className="w-full h-full text-blue-600" />
        </div>
      </div>

      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/50 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-emerald-100/50 via-transparent to-transparent"></div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 lg:px-8 transition-all duration-1000 ease-out">
        <div className="max-w-7xl mx-auto text-center">
          <div className={`mb-8 transition-all duration-1000 ease-out delay-200 ${scrollY < 100 ? 'opacity-100 translate-y-0' : 'opacity-80'}`}>
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-800 text-sm font-medium mb-6 hover:bg-blue-200 hover:scale-105 transition-all duration-300">
              <Building className="w-4 h-4 mr-2" />
              Official Government Technology Platform
            </div>
          </div>
          
          <div className={`relative transition-all duration-1200 ease-out delay-400 ${scrollY < 100 ? 'opacity-100 translate-y-0' : 'opacity-70'}`}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
              <span className="block text-slate-900 mb-4">
                Safer Cities Through
              </span>
              <span className="block bg-gradient-to-r from-blue-700 to-emerald-700 bg-clip-text text-transparent">
                Intelligent Technology
              </span>
            </h1>
          </div>
          
          <p className={`text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed font-medium transition-all duration-1000 ease-out delay-600 ${scrollY < 100 ? 'opacity-100 translate-y-0' : 'opacity-60'}`}>
            CitySafeAI leverages advanced artificial intelligence to predict crime patterns, 
            optimize police deployment, and provide citizens with real-time safety guidance. 
            Building smarter, safer communities through data-driven governance.
          </p>
          
          <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center transition-all duration-1000 ease-out delay-800 ${scrollY < 100 ? 'opacity-100 translate-y-0' : 'opacity-70'}`}>
            <button 
              onClick={handleCitizenPortalClick}
              className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 flex items-center space-x-3 hover:from-blue-700 hover:to-blue-800"
            >
              <Users className="w-5 h-5 transition-transform duration-300 group-hover:rotate-3" />
              <span>Citizen Portal</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            
            <button 
              onClick={handleLawEnforcementPortalClick}
              className="group bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 flex items-center space-x-3 hover:from-emerald-700 hover:to-emerald-800"
            >
              <Shield className="w-5 h-5 transition-transform duration-300 group-hover:rotate-3" />
              <span>Law Enforcement Portal</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            
            <button className="group flex items-center space-x-3 text-slate-600 hover:text-blue-700 transition-colors duration-300 mt-4 sm:mt-0 hover:scale-105 transform transition-all duration-300">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-100 to-blue-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-slate-200 group-hover:border-blue-300 group-hover:shadow-lg">
                  <Play className="w-5 h-5 ml-1 text-blue-600 transition-colors duration-300 group-hover:text-blue-700" />
                </div>
                <div className="absolute inset-0 bg-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
              </div>
              <span className="text-lg font-medium">Platform Demo</span>
            </button>
          </div>
        </div>

        {/* Government Credibility Elements */}
        <div className={`absolute bottom-10 left-1/2 transform -translate-x-1/2 transition-all duration-1000 ease-out delay-1000 ${scrollY < 100 ? 'opacity-100 translate-y-0' : 'opacity-50'}`}>
          <div className="flex items-center space-x-8 text-slate-500 text-sm">
            <div className="flex items-center space-x-2 hover:text-blue-600 transition-colors duration-300 cursor-default">
              <Award className="w-4 h-4 transition-transform duration-300 hover:scale-110" />
              <span>Government Certified</span>
            </div>
            <div className="flex items-center space-x-2 hover:text-emerald-600 transition-colors duration-300 cursor-default">
              <Shield className="w-4 h-4 transition-transform duration-300 hover:scale-110" />
              <span>Secure & Compliant</span>
            </div>
            <div className="flex items-center space-x-2 hover:text-amber-600 transition-colors duration-300 cursor-default">
              <Globe className="w-4 h-4 transition-transform duration-300 hover:scale-110" />
              <span>Multi-City Deployment</span>
            </div>
          </div>
        </div>

        {/* Floating Elements with Parallax */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-1/4 left-10 w-6 h-6 bg-blue-200 rounded-full opacity-40 transition-transform duration-1000"
            style={{ transform: `translateY(${scrollY * 0.1}px) rotate(${scrollY * 0.05}deg)` }}
          ></div>
          <div 
            className="absolute top-1/3 right-20 w-4 h-4 bg-emerald-200 rounded-full opacity-40 transition-transform duration-1000"
            style={{ transform: `translateY(${scrollY * -0.15}px) rotate(${scrollY * -0.08}deg)` }}
          ></div>
          <div 
            className="absolute bottom-1/4 left-1/4 w-5 h-5 bg-amber-200 rounded-full opacity-40 transition-transform duration-1000"
            style={{ transform: `translateY(${scrollY * 0.12}px) rotate(${scrollY * 0.06}deg)` }}
          ></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-6 lg:px-8 bg-white transition-all duration-1000 ease-out">
        <div className="max-w-7xl mx-auto">
          <div 
            className="text-center mb-20"
            data-animate="features-header"
            id="features-header"
          >
            <div className={`inline-flex items-center px-4 py-2 bg-slate-100 rounded-full text-slate-700 text-sm font-medium mb-6 transition-all duration-1000 ease-out ${visibleElements.has('features-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} hover:bg-slate-200 hover:scale-105 transition-all duration-300`}>
              <Brain className="w-4 h-4 mr-2 transition-transform duration-300 hover:rotate-12" />
              Advanced Technology Solutions
            </div>
            <h2 className={`text-4xl md:text-6xl font-bold mb-6 text-slate-900 transition-all duration-1200 ease-out delay-200 ${visibleElements.has('features-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Comprehensive Safety Platform
            </h2>
            <p className={`text-xl text-slate-600 max-w-3xl mx-auto font-medium transition-all duration-1000 ease-out delay-400 ${visibleElements.has('features-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Integrated AI-powered tools designed to enhance public safety through predictive analytics, 
              resource optimization, and community engagement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                data-animate={`feature-${index}`}
                id={`feature-${index}`}
                className={`group relative bg-gradient-to-br from-white to-slate-50 rounded-xl p-8 border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-700 ease-out hover:transform hover:scale-105 hover:-translate-y-2 ${visibleElements.has(`feature-${index}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{
                  transitionDelay: `${index * 200 + 600}ms`
                }}
              >
                <div className="relative mb-6 overflow-hidden">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg group-hover:shadow-xl`}>
                    <feature.icon className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-blue-700 transition-all duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-slate-600 leading-relaxed font-medium group-hover:text-slate-700 transition-colors duration-300">
                  {feature.description}
                </p>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                    <ChevronRight className="w-4 h-4 text-blue-600 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </div>

                {/* Subtle Background Animation */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-emerald-50/0 group-hover:from-blue-50/30 group-hover:to-emerald-50/30 rounded-xl transition-all duration-500 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Transition Effect */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative py-32 px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-emerald-50 transition-all duration-1000 ease-out overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-20 left-20 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl transition-transform duration-2000"
            style={{ transform: `translateX(${scrollY * 0.05}px) translateY(${scrollY * -0.03}px)` }}
          ></div>
          <div 
            className="absolute bottom-20 right-20 w-40 h-40 bg-emerald-200/20 rounded-full blur-3xl transition-transform duration-2000"
            style={{ transform: `translateX(${scrollY * -0.04}px) translateY(${scrollY * 0.02}px)` }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div 
            className="text-center mb-20"
            data-animate="stats-header"
            id="stats-header"
          >
            <div className={`inline-flex items-center px-4 py-2 bg-white rounded-full text-slate-700 text-sm font-medium mb-6 shadow-sm transition-all duration-1000 ease-out ${visibleElements.has('stats-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} hover:shadow-md hover:scale-105 transition-all duration-300`}>
              <TrendingUp className="w-4 h-4 mr-2 transition-transform duration-300 hover:rotate-12" />
              Proven Results & Impact
            </div>
            <h2 className={`text-4xl md:text-6xl font-bold mb-6 text-slate-900 transition-all duration-1200 ease-out delay-200 ${visibleElements.has('stats-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Measurable Community Impact
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                data-animate={`stat-${index}`}
                id={`stat-${index}`}
                className={`text-center group bg-white rounded-xl p-8 shadow-lg border border-slate-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-700 ease-out hover:transform hover:scale-110 hover:-translate-y-3 ${visibleElements.has(`stat-${index}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{
                  transitionDelay: `${index * 150 + 400}ms`
                }}
              >
                <div className="relative mb-4 overflow-hidden">
                  <div className="text-4xl md:text-5xl font-bold text-blue-700 group-hover:scale-125 transition-all duration-500 group-hover:text-emerald-600">
                    {stat.number}
                  </div>
                </div>
                <p className="text-slate-600 text-lg font-semibold group-hover:text-slate-800 transition-colors duration-300">
                  {stat.label}
                </p>

                {/* Floating Icon Effect */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-0 group-hover:scale-100">
                  <div className="w-full h-full rounded-full bg-white/30 animate-ping"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Transition Effect */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-blue-700 to-transparent opacity-20"></div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="relative py-32 px-6 lg:px-8 bg-gradient-to-r from-blue-700 to-emerald-700 overflow-hidden">
        {/* Advanced Background Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div 
            className="mb-8"
            data-animate="cta-header"
            id="cta-header"
          >
            <div className={`inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6 transition-all duration-1000 ease-out ${visibleElements.has('cta-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} hover:bg-white/30 hover:scale-105 transition-all duration-300`}>
              <Building className="w-4 h-4 mr-2 transition-transform duration-300 hover:rotate-12" />
              Ready for Implementation
            </div>
          </div>
          
          <h2 className={`text-4xl md:text-6xl font-bold mb-8 text-white transition-all duration-1200 ease-out delay-200 ${visibleElements.has('cta-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Transform Your Community Safety
          </h2>
          
          <p className={`text-xl text-blue-100 mb-12 leading-relaxed font-medium transition-all duration-1000 ease-out delay-400 ${visibleElements.has('cta-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Join leading cities worldwide in implementing AI-driven public safety solutions. 
            Contact our government partnerships team to begin your digital transformation journey.
          </p>
          
          <div className={`flex flex-col sm:flex-row gap-6 justify-center transition-all duration-1000 ease-out delay-600 ${visibleElements.has('cta-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button className="group bg-white text-blue-700 px-10 py-5 rounded-lg text-xl font-bold hover:shadow-2xl hover:bg-blue-50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center space-x-3">
              <span>Schedule Consultation</span>
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            
            <button className="px-10 py-5 rounded-lg text-xl font-bold border-2 border-white text-white hover:bg-white hover:text-blue-700 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
              Request Proposal
            </button>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-1/4 left-10 w-4 h-4 bg-white/20 rounded-full transition-transform duration-2000"
            style={{ transform: `translateY(${scrollY * 0.1}px) rotate(${scrollY * 0.05}deg)` }}
          ></div>
          <div 
            className="absolute top-1/3 right-20 w-6 h-6 bg-white/15 rounded-full transition-transform duration-2000"
            style={{ transform: `translateY(${scrollY * -0.15}px) rotate(${scrollY * -0.08}deg)` }}
          ></div>
          <div 
            className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-white/25 rounded-full transition-transform duration-2000"
            style={{ transform: `translateY(${scrollY * 0.12}px) rotate(${scrollY * 0.06}deg)` }}
          ></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-200 py-12 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-blue-900">
                  CitySafeAI
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Government Technology Initiative
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-8 text-slate-500">
              <a href="#" className="hover:text-blue-700 transition-colors font-medium">Privacy Policy</a>
              <a href="#" className="hover:text-blue-700 transition-colors font-medium">Terms of Service</a>
              <a href="#" className="hover:text-blue-700 transition-colors font-medium">Contact Support</a>
            </div>
          </div>
          
          <div className="border-t border-slate-200 mt-8 pt-8 text-center text-slate-500">
            <p className="font-medium">© 2025 CitySafeAI Government Initiative. Advancing public safety through artificial intelligence and data analytics.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}