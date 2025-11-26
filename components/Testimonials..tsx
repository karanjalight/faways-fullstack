"use client";
import React, { useRef, useEffect } from "react";
import { Star } from "lucide-react";

const TestimonialsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const testimonials = [
    {
      id: 1,
      name: "Sarah Mwangi",
      text: "Faways Solutions helped us recover outstanding debts quickly and professionally. Their “No Win, No Fee” approach gave us confidence, and we got results without affecting our reputation.",
      rating: 5,
      role: "Small Business Owner",
      image: "https://ui-avatars.com/api/?name=Sarah+Mwangi&background=b38f62&color=fff&size=128",
    },
    {
      id: 2,
      name: "James Ochieng",
      text: "The property management team at Faways Solutions ensures timely rent collection and handles all tenant interactions seamlessly. It’s made managing my rental properties effortless.",
      rating: 5,
      role: "Landlord",
      image: "https://ui-avatars.com/api/?name=James+Ochieng&background=02273f&color=fff&size=128",
    },
    {
      id: 3,
      name: "Mary Wanjiku",
      text: "Their bookkeeping and financial management services are excellent. Faways Solutions helped us maintain accurate records and improve cash flow visibility, ensuring compliance and peace of mind.",
      rating: 5,
      role: "Entrepreneur",
      image: "https://ui-avatars.com/api/?name=Mary+Wanjiku&background=b38f62&color=fff&size=128",
    },
    {
      id: 4,
      name: "David Kimani",
      text: "Faways’ credit control consultancy transformed how we manage client credit. Bad debts decreased and cash flow improved. Their personalized approach works!",
      rating: 5,
      role: "Finance Manager",
      image: "https://ui-avatars.com/api/?name=David+Kimani&background=02273f&color=fff&size=128",
    },
  ];

  const duplicatedTestimonials = [...testimonials, ...testimonials];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const cardWidth = 400;
    const scrollSpeed = 1;

    const scroll = () => {
      scrollPosition += scrollSpeed;
      if (scrollPosition >= cardWidth * testimonials.length) {
        scrollPosition = 0;
      }
      if (scrollContainer) {
        scrollContainer.scrollLeft = scrollPosition;
      }
    };

    const intervalId = setInterval(scroll, 20);
    return () => clearInterval(intervalId);
  }, [testimonials.length]);

  return (
    <section className="w-full py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="max-w-8xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-[#02273f] font-semibold text-sm uppercase tracking-wider bg-[#b38f62]/20 px-4 py-2 rounded-full">
              Client Stories
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#02273f] mb-4 text-center ">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Here’s what our clients say about working with Faways Solutions in debt management, property management, and financial consultancy.
          </p>
        </div>

        {/* Scrolling Testimonials Container */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-hidden scrollbar-hide py-4"
            style={{ scrollBehavior: 'auto' }}
          >
            {duplicatedTestimonials.map((testimonial, index) => (
              <div
                key={`${testimonial.id}-${index}`}
                className="flex-shrink-0 w-[380px] bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 hover:-translate-y-2 group"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-gray-700 text-base leading-relaxed mb-6 line-clamp-4 group-hover:line-clamp-none transition-all">
                  “{testimonial.text}”
                </p>

                <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full shadow-md"
                  />
                  <div>
                    <h4 className="text-[#02273f] font-bold text-lg">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Join our satisfied clients who trust Faways Solutions for professionalism, efficiency, and reliable results.
          </p>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default TestimonialsSection;
