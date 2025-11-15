'use client';

import { useState } from 'react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="overflow-x-hidden bg-white font-['Montserrat']">
      {/* Top Navigation */}
      <nav className="bg-sky-900">
        <div className="max-w-screen-xl mx-auto text-white py-2 px-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-bold">Contact Us</span>
            </div>
            <div className="flex lg:flex-row flex-col lg:items-center items-end lg:text-sm text-xs space-x-6">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24">
                  <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.502 4.257A2 2 0 0 0 7.646 3H4.895A1.895 1.895 0 0 0 3 4.895C3 13.789 10.21 21 19.106 21A1.895 1.895 0 0 0 21 19.105v-2.751a2 2 0 0 0-1.257-1.857l-2.636-1.054a2 2 0 0 0-2.023.32l-.68.568a2 2 0 0 1-2.696-.122L9.792 12.29a2 2 0 0 1-.123-2.694l.567-.68a2 2 0 0 0 .322-2.024z" />
                </svg>
                <span className="lg:text-sm text-xs">0735 343000</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 4.106H3.553C2.696 4.106 2 4.802 2 5.66v12.68c0 .858.696 1.554 1.553 1.554h16.894c.858 0 1.553-.696 1.553-1.553V5.66c0-.858-.695-1.554-1.553-1.554zM20 6.234l-8 5.333L4 6.234v-.575l8 5.333 8-5.333v.575z" />
                </svg>
                <span className="lg:text-sm text-xs">info@fawaysolutions.co.ke</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Navbar */}
      <nav className="border-gray-200 sticky top-0 z-50 bg-white p-1 shadow-md">
        <div className="flex flex-wrap items-center justify-between lg:mx-auto lg:max-w-screen-xl lg:p-1">
        <a
          href="/"
          className="flex lg:flex-row flex-col gap-1 lg:items-center items-start lg:space-x-3 lg:rtl:space-x-reverse"
        >
          <img
            src="https://fawayssolutions.vercel.app/static/img/logo.png"
            className="lg:h-20 h-14"
            alt="Faways Solutins Logo"
          />
        </a>
          
          <div className="flex md:order-2 space-x-3 md:space-x-0">
            <a href="#contact" className="bg-sky-600 rounded-full">
              <div className="py-2 text-sm rounded lg:py-2 h-full text-white px-8">
                Get in Touch
              </div>
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm rounded-full md:hidden hover:bg-gray-100"
            >
              <svg className="w-5 text-gray-900 h-5" fill="none" viewBox="0 0 17 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
              </svg>
            </button>
          </div>
          
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} items-center justify-between w-full md:flex md:w-auto md:order-1`}>
            <ul className="flex flex-col text-gray-900 capitalize text-sm font-medium p-4 md:p-0 mt-4 rounded-full md:space-x-8 md:flex-row md:mt-0">
              <li><a href="/" className="block py-2 px-3 md:p-0 text-sky-700 font-semibold">Home</a></li>
              <li><a href="#about" className="block py-2 md:p-0 hover:text-sky-700">About Us</a></li>
              <li><a href="#mission" className="block py-2 md:p-0 hover:text-sky-700">Our Solutions</a></li>
              <li><a href="#management" className="block py-2 md:p-0 hover:text-sky-700">Management System</a></li>
              <li><a href="#contact" className="block py-2 md:p-0 hover:text-sky-700">Book Consultation</a></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section py-24 md:py-20 lg:py-20 px-4 w-full flex flex-col items-center lg:justify-center overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="bg-sky-500 opacity-20 w-64 h-64 rounded-full absolute -top-20 -left-20 animate-pulse"></div>
          <div className="bg-sky-600 opacity-5 w-96 h-96 rounded-full absolute bottom-0 right-0"></div>
          <div className="bg-sky-400 opacity-20 w-40 h-24 rounded-full absolute top-1/3 right-1/4"></div>
        </div>

        <div className="container mx-auto z-10">
          <div className="flex lg:flex-row flex-col gap-10 items-center mx-auto max-w-6xl">
            <div className="flex lg:w-3/5 w-full">
              <div className="flex lg:py-0 py-5 relative w-full">
                <div className="space-y-4 w-full">
                  <h1 className="text-4xl md:text-6xl lg:text-5xl font-bold text-gray-800 text-center lg:text-left leading-tight">
                    FAWAYS BUSINESS <span className="text-sky-700">SOLUTION</span>
                  </h1>

                  <p className="text-gray-600 text-sm text-center lg:text-left max-w-2xl">
                    Your Debt Is Our Concern
                  </p>
                  <p className="text-gray-600 text-xl text-left">
                    Faways Business Solutions is a trusted debt collection and management company based in Nairobi, serving clients across Kenya since 2013
                  </p>
                  <p className="font-medium text-sky-700 text-left lg:text-lg text-lg mt-2">
                    90% Recovery Success Rate
                  </p>

                  <div className="flex items-center lg:gap-4 gap-2">
                    <div>
                      <div className="flex items-center space-x-1 text-sky-500 text-xl">
                        <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                      </div>
                      <div className="text-gray-600 lg:text-lg text-sm">
                        10+ Happy partners and counting
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-center lg:justify-start justify-center pt-4">
                    <a href="#contact" className="border-2 border-sky-600 bg-gradient-to-r from-sky-800 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white py-2 text-lg px-8 rounded-full transition-all duration-300 transform hover:-translate-y-1 text-center w-full sm:w-auto">
                      <span className="flex items-center justify-center">
                        <span>Get In Touch</span>
                      </span>
                    </a>
                    <a href="#contact" className="bg-white border-2 border-sky-700 text-sky-700 py-2 px-8 rounded-full text-lg hover:shadow-sm hover:bg-sky-100 transition-all duration-300 text-center w-full sm:w-auto">
                      <span className="flex items-center justify-center">
                        <span>Book Consultation</span>
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-2/5 w-full mt-8 lg:mt-0 lg:block hidden">
              <div className="relative mx-auto max-w-md px-4 sm:px-0">
                <div className="absolute inset-0 bg-sky-500 rounded-full transform rotate-3 scale-105 opacity-20 blur-lg z-0"></div>
                <div className="relative bg-gradient-to-br from-sky-600 to-sky-400 p-1 lg:h-[50vh] lg:w-[50vh] h-[40vh] w-[40vh] rounded-full overflow-hidden z-10">
                  <img src="https://okenyoomwansaadvocates.co.ke/wp-content/uploads/2025/07/ChatGPT-Image-Jul-17-2025-11_07_56-AM-1024x683.png" alt="Debt Collection" className="object-cover w-full h-full rounded-full transition-transform duration-700 transform hover:scale-105" />
                </div>
                <div className="absolute -bottom-4 right-4 md:-bottom-5 md:-right-5 bg-white text-sky-600 py-1.5 px-4 rounded-lg lg:text-lg text-sm border animate-bounce transform rotate-3 border-l-4 border-sky-600 z-20">
                  Quick Debt Recovery
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Management System CTA Section */}
      <section id="management" className="py-16 ">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
           
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Take Control of Your <span className="text-blue-600">Debts</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Access our comprehensive debt management system to track, manage, and monitor all your debts in one place. Stay organized and make informed financial decisions.
            </p>

            <div className="flex items-center justify-center gap-4 mb-12">
              <a href="/login" className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Get Started
              </a>
              <a href="/login" className="rounded-lg border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                Sign In
              </a>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 mx-auto">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Track Everything</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Monitor all your debts, payments, and due dates in a single dashboard.
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 mx-auto">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Smart Analytics</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Get insights into your debt situation with real-time statistics and progress tracking.
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 mx-auto">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Stay Organized</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Filter, search, and prioritize your debts to focus on what matters most.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <div id="about" className="hero-section py-24 md:py-12 bg-sky-200 lg:py-10 px-4 w-full flex flex-col items-center lg:justify-center overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="bg-sky-500 opacity-20 w-32 h-32 rounded-full absolute top-12 animate-bounce left-10"></div>
          <div className="bg-sky-400 opacity-20 w-40 h-24 rounded-full absolute top-1/3 right-1/4"></div>
        </div>
        
        <section className="py-16 relative z-10">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">About Us</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Faways Business Solutions is committed to redefining debt management through professionalism, integrity, and efficiency.
              </p>
            </div>

            <div className="bg-white shadow-sm rounded-2xl p-8 mb-10 border border-sky-500">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Company Overview</h3>
              <p className="text-gray-700 leading-relaxed">
                Established in <span className="font-semibold text-gray-900">2013</span>, Faways Business Solution is headquartered at <span className="text-gray-900">Nyambene House, Moi Avenue, Nairobi</span>, with branches across the <span className="text-gray-900">Western, Rift Valley, and Coast regions</span>. The company provides structured, professional <span className="font-medium">debt collection and tracing services</span> focused on <span className="font-medium">efficiency, confidentiality, and integrity</span>.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="bg-white shadow-sm rounded-2xl p-8 border border-sky-500">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Vision Statement</h3>
                <p className="text-gray-700">
                  "To become the leading and most competent management and debt collection service provider in Kenya by offering high-quality professional advisory and consultancy."
                </p>
              </div>

              <div className="bg-white shadow-sm rounded-2xl p-8 border border-sky-500">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Corporate Mission</h3>
                <p className="text-gray-700">
                  "To promote efficiency in the management of debts and set high standards in credit control systems through personalized, affordable, and effective collection strategies."
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-center justify-center pt-4">
              <a href="#contact" className="border-2 border-sky-600 bg-gradient-to-r from-sky-800 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white py-2 text-lg px-8 rounded-full transition-all duration-300 transform hover:-translate-y-1 text-center w-full sm:w-auto">
                Get In Touch
              </a>
              <a href="#contact" className="border-2 border-sky-700 text-sky-700 py-2 px-8 rounded-full text-lg hover:shadow-sm hover:bg-sky-100 transition-all duration-300 text-center w-full sm:w-auto">
                Book Consultation
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Core Values */}
      <div className="mx-auto max-w-7xl text-center lg:py-20 py-10">
        <div className="bg-white shadow-sm rounded-2xl p-8 border border-gray-100 mb-10">
          <h3 className="text-3xl font-semibold text-gray-800 mb-6">Core Values</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 border-l-4 border border-sky-600 bg-sky-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-1">Trustworthiness</h4>
              <p className="text-gray-600 text-sm">Maintaining client confidentiality.</p>
            </div>
            <div className="p-4 border-l-4 border border-sky-600 bg-sky-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-1">Professionalism</h4>
              <p className="text-gray-600 text-sm">Providing skilled, high-standard service.</p>
            </div>
            <div className="p-4 border-l-4 border border-sky-500 bg-sky-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-1">Integrity</h4>
              <p className="text-gray-600 text-sm">Acting with honesty and respect.</p>
            </div>
            <div className="p-4 border-l-4 border border-sky-500 bg-sky-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-1">Efficiency</h4>
              <p className="text-gray-600 text-sm">Managing debts promptly and effectively.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <section id="mission" className="bg-gradient-to-b from-gray-50 to-white pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Mission & Philosophy</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Purpose-driven goals that inspire trust, efficiency, and long-term client success.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="group bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-sky-500 hover:-translate-y-1 transition-all duration-300">
              <div className="text-blue-600 text-3xl mb-4">⚡</div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Speed & Awareness</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Sensitize clients on the importance of collecting debts faster and maintaining a proactive approach.
              </p>
            </div>

            <div className="group bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-sky-500 hover:-translate-y-1 transition-all duration-300">
              <div className="text-green-600 text-3xl mb-4">💼</div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Efficiency & Effectiveness</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Deliver efficient and effective services aligned with client terms of reference and objectives.
              </p>
            </div>

            <div className="group bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-sky-500 hover:-translate-y-1 transition-all duration-300">
              <div className="text-purple-600 text-3xl mb-4">🎯</div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Objectivity & Integrity</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Stay objective while prioritizing the client's interests and maintaining transparency at all times.
              </p>
            </div>

            <div className="group bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-sky-500 hover:-translate-y-1 transition-all duration-300">
              <div className="text-yellow-600 text-3xl mb-4">🤝</div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Meaningful Contribution</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Add measurable value to every organization and industry we serve through smart debt solutions.
              </p>
            </div>

            <div className="group bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-sky-500 hover:-translate-y-1 transition-all duration-300">
              <div className="text-red-600 text-3xl mb-4">🔒</div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Confidentiality</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Uphold absolute confidentiality for all client data and communications, ensuring complete trust.
              </p>
            </div>

            <div className="group bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-sky-500 hover:-translate-y-1 transition-all duration-300">
              <div className="text-indigo-600 text-3xl mb-4">🧩</div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">Tailored Approaches</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Customize every recovery strategy to suit client needs, ensuring efficiency and long-term results.
              </p>
            </div>
          </div>

          <div className="bg-sky-200 text-black rounded-3xl shadow-xl p-10 text-center">
            <h3 className="text-2xl font-bold mb-4">Our Philosophy</h3>
            <p className="max-w-3xl mx-auto text-sky-900 text-lg leading-relaxed">
              At Faways, we are <span className="font-semibold text-black">client-centered</span>. Our highest priority is <span className="font-semibold">client satisfaction</span> — maintaining strong, respectful relationships with both clients and their debtors. Every engagement is driven by <span className="font-semibold">integrity, empathy, and professionalism</span>.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <div id="contact" className="py-2 lg:py-12 py-16 bg-sky-200">
        <h1 className="lg:text-3xl text-center text-2xl font-semibold text-sky-900 mb-9">
          Get In Touch
        </h1>
        <div className="flex lg:px-60 px-4 lg:flex-row flex-col-reverse w-full mb-20 justify-between">
          <div className="lg:w-1/4 px-4 py-8 w-full">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Hit Us Up</h2>
            <ol className="relative text-gray-800 border-s border-gray-200">
              <li className="mb-10 ms-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-sky-700 rounded-full -start-4 ring-2 ring-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="m16.1 13.359l.456-.453c.63-.626 1.611-.755 2.417-.317l1.91 1.039c1.227.667 1.498 2.302.539 3.255l-1.42 1.412c-.362.36-.81.622-1.326.67M4.003 5.745c-.035-.62.255-1.178.689-1.61l1.57-1.56c.874-.87 2.348-.735 3.111.284l1.261 1.684c.617.824.55 1.952-.157 2.654l-.286.286" />
                      <path d="M18.676 18.965c-1.63.152-5.614-.016-9.86-4.238c-4.005-3.982-4.723-7.395-4.813-8.981" opacity="0.5" />
                      <path strokeLinecap="round" d="M16.1 13.359s-1.082 1.076-4.037-1.862s-1.872-4.015-1.872-4.015" opacity="0.5" />
                    </g>
                  </svg>
                </span>
                <h3 className="font-medium leading-tight">Phone Number</h3>
                <p className="text-sm">0729 806 234<br />0735 343000</p>
              </li>
              <li className="mb-10 ms-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-sky-700 rounded-full -start-4 ring-4 ring-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 48 48">
                    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4">
                      <path d="M44 24V9H4v30h20m20-5H30m9-5l5 5l-5 5" />
                      <path d="m4 9l20 15L44 9" />
                    </g>
                  </svg>
                </span>
                <h3 className="font-medium leading-tight">Email</h3>
                <p className="text-sm">info@fawaysolutions.co.ke</p>
              </li>
            </ol>
          </div>

          <div className="lg:w-3/4 w-full">
            <div className="white">
              <div className="contact-page">
                <section>
                  <div className="px-4 mx-auto max-w-2xl">
                    <h2 className="mb-4 text-xl font-bold text-gray-900">Get in Touch</h2>
                    <p className="text-sm my-3 text-gray-800">
                      Fill the form below to get in touch today!
                    </p>
                    <form className="space-y-4">
                      <div className="sm:col-span-2">
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900">Name</label>
                        <input type="text" name="name" id="name" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Your name" required />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="w-full">
                          <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900">Email</label>
                          <input type="email" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Your email" required />
                        </div>

                        <div className="w-full">
                          <label htmlFor="number" className="block mb-2 text-sm font-medium text-gray-900">Phone Number</label>
                          <input type="text" name="number" id="number" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="+2547 *** ***" required />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-900">Message</label>
                        <textarea name="message" id="message" rows={4} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Your message" required></textarea>
                      </div>

                      <button type="submit" className="w-full text-center capitalize text-white bg-sky-600 items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium rounded-full hover:bg-sky-700 focus:ring-4 focus:ring-sky-300">
                        Submit
                      </button>
                    </form>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews */}
      <div className="my-12 lg:my-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="lg:text-3xl text-2xl font-bold text-gray-800 text-center mb-5 lg:mb-12 leading-tight">
          What Our <span className="text-sky-900">Clients Say</span>
        </h1>

        <div className="grid grid-cols-1 text-sm gap-6 md:grid-cols-4 mx-2">
          <div className="p-6 flex flex-col items-center bg-white rounded-lg shadow-md transition-transform transform hover:scale-105">
            <div className="flex items-center mb-2">
              <span className="text-sky-500">★★★★★</span>
            </div>
            <p className="text-gray-700 mb-4 text-center">
              "Faways has been our trusted partner for over five years. Their professionalism and confidentiality in handling sensitive client data are unmatched."
            </p>
            <h3 className="font-semibold text-gray-800">John Mwangi</h3>
            <p className="text-gray-500 text-xs">Credit Manager, Capital Bank Ltd</p>
          </div>

          <div className="p-6 flex flex-col items-center bg-white rounded-lg shadow-md transition-transform transform hover:scale-105">
            <div className="flex items-center mb-2">
              <span className="text-sky-500">★★★★★</span>
            </div>
            <p className="text-gray-700 mb-4 text-center">
              "Their debt recovery approach is transparent and respectful. They treat our clients with dignity while ensuring excellent results."
            </p>
            <h3 className="font-semibold text-gray-800">Grace Achieng</h3>
            <p className="text-gray-500 text-xs">Finance Officer, Umoja Sacco</p>
          </div>

          <div className="p-6 flex flex-col items-center bg-white rounded-lg shadow-md transition-transform transform hover:scale-105">
            <div className="flex items-center mb-2">
              <span className="text-sky-500">★★★★★</span>
            </div>
            <p className="text-gray-700 mb-4 text-center">
              "Their team is efficient and proactive. We saw a major improvement in our recovery rate within months of partnering with Faways."
            </p>
            <h3 className="font-semibold text-gray-800">Samuel Kiptoo</h3>
            <p className="text-gray-500 text-xs">Managing Director, Rift Valley Traders</p>
          </div>

          <div className="p-6 flex flex-col items-center bg-white rounded-lg shadow-md transition-transform transform hover:scale-105">
            <div className="flex items-center mb-2">
              <span className="text-sky-500">★★★★★</span>
            </div>
            <p className="text-gray-700 mb-4 text-center">
              "Their integrity and constant communication make them stand out. Faways truly understands the importance of client trust."
            </p>
            <h3 className="font-semibold text-gray-800">Lucy Wanjiru</h3>
            <p className="text-gray-500 text-xs">Operations Lead, Coastline Holdings</p>
          </div>
        </div>
      </div>

      {/* Partners Gallery */}
      <h1 className="lg:text-3xl text-2xl lg:mt-20 mt-8 font-bold text-gray-800 text-center mb-5 lg:mb-12 leading-tight">
        Our <span className="text-sky-900">Partners</span>
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mx-auto max-w-7xl px-4 mb-16">
        <div className="mb-4 flex flex-col gap-4">
          <div>
            <img className="h-auto max-w-full rounded-lg" src="https://www.nationmedia.com/annualreport2022/images/nmg%20logo.png" alt="Nation Media Group" />
          </div>
          <div>
            <img className="h-auto max-w-full rounded-lg" src="https://afridoctor.com/cdn/storage/userFiles/xswkhP9zdYCqtJLFg/original/xswkhP9zdYCqtJLFg.png" alt="Partner" />
          </div>
        </div>
        <div className="mb-4 flex flex-col gap-8">
          <div>
            <img className="h-auto max-w-full rounded-lg" src="https://cms.thenairobihosp.org/uploads/home_about_hosi_0f702bbc5f.jpg" alt="Nairobi Hospital" />
          </div>
        </div>
        <div className="grid gap-4">
          <div>
            <img className="h-40 max-w-full rounded-lg object-cover w-full" src="https://static1.squarespace.com/static/65ad0da01776560c56886d7d/t/65c118364c25440490cc8302/1743260868758/" alt="Partner" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-sky-600 rounded lg:mt-32 mt-5">
        <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-16">
          <div className="md:flex md:justify-between">
            <div className="mb-6 md:mb-0">
              <a href="/" className="flex flex-col gap-1 items-center">
                <span className="self-center capitalize text-2xl text-white whitespace-nowrap">Faways Solutions</span>
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-2 text-md sm:grid-cols-4">
              <div>
                <h2 className="mb-6 font-semibold text-white uppercase">Resources</h2>
                <ul className="text-white font-medium">
                  <li className="mb-4"><a href="#about" className="hover:underline">About</a></li>
                  <li className="mb-4"><a href="/login" className="hover:underline">Get Started</a></li>
                </ul>
              </div>
              <div>
                <h2 className="mb-6 text-sm font-semibold text-white uppercase">Follow us</h2>
                <ul className="text-white font-medium">
                  <li className="mb-4"><a href="https://www.facebook.com/" className="hover:underline">Facebook</a></li>
                  <li><a href="https://x.com/" className="hover:underline">Twitter</a></li>
                </ul>
              </div>
              <div>
                <h2 className="mb-6 text-sm font-semibold text-white uppercase">Contact Us</h2>
                <ul className="text-white font-medium">
                  <li className="mb-4"><a href="tel:0729806234" className="hover:underline">0729 806 234</a></li>
                  <li className="mb-4"><a href="tel:0735343000" className="hover:underline">0735 343000</a></li>
                  <li><a href="mailto:info@fawaysolutions.co.ke" className="hover:underline">info@fawaysolutions.co.ke</a></li>
                </ul>
              </div>
            </div>
          </div>
          <hr className="my-6 border-gray-200 sm:mx-auto lg:my-8" />
          <div className="sm:flex sm:items-center sm:justify-center">
            <span className="text-sm sm:text-center text-white">
              © 2025 <a href="https://fawaysolutions.co.ke/" className="hover:underline">Faways Solutions™</a>. All Rights Reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}