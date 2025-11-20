"use client";
import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: 'How long does Faways take to start debt recovery?',
      answer: 'We aim to start the debt recovery process immediately after engagement. Our professional team works efficiently while maintaining confidentiality, ensuring your reputation is protected and your dues are recovered quickly.'
    },
    {
      question: 'Do you provide rent collection and property management services?',
      answer: 'Yes! We manage rent collection, tenant screening, lease agreements, and property reports. Our goal is to ensure landlords receive timely payments while maintaining good tenant relationships.'
    },
    {
      question: 'What bookkeeping and financial management services do you offer?',
      answer: 'Faways Solutions helps businesses maintain accurate financial records, manage cash flow, prepare financial statements, and ensure compliance with accounting standards. Our team ensures transparency and effective financial management.'
    },
    {
      question: 'How does your credit control consultancy work?',
      answer: 'We work with businesses to strengthen credit policies, minimize bad debts, and improve cash flow. Our personalized approach ensures financial stability and profitability while reducing risk.'
    },
    {
      question: 'Which areas do you serve?',
      answer: 'We currently serve clients across Nairobi, Kiambu, Mombasa, Nakuru, and Eldoret. Our services cater to businesses, landlords, and individuals requiring professional financial and property management solutions.'
    },
    {
      question: 'Do you operate on a "No Win, No Fee" basis?',
      answer: 'Yes! For debt collection and recovery services, our “No Win, No Fee” model guarantees commitment to results without upfront risk for our clients.'
    }
  ];

  const toggleFAQ = (index: React.SetStateAction<number>) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="w-full px-4 lg:px-0 bg-white lg:h-screen mb-10">
      <div className="mx-auto">
        <div className="flex lg:flex-row flex-col gap-8 items-center">
          {/* Left Side - Image */}
          <div className="relative overflow-hidden lg:w-2/5 w-full h-[30vh] lg:h-screen">
            <img
              src="/african-american-business-team-collaborates-global-expansion-strategy.jpg"
              alt="Faways Solutions"
              className="w-full h-full object-center object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#b38f62] to-transparent opacity-30"></div>
          </div>

          {/* Right Side - FAQs */}
          <div className='mx-auto lg:mr-20 max-w-4xl'>
            <h2 className="text-4xl md:text-5xl font-bold text-[#02273f] mb-4">FAQs</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Have questions about Faways Solutions? Here are the most frequently asked questions about our debt management, property, and financial services.
            </p>

            {/* FAQ Accordion */}
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`overflow-hidden transition-all ${
                    openIndex === index
                      ? 'bg-[#02273f] text-white shadow-lg'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between p-5 text-left hover:opacity-90 transition-opacity"
                  >
                    <span className="font-medium pr-4">{faq.question}</span>
                    <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center ${
                      openIndex === index ? 'bg-white' : 'bg-[#02273f]'
                    }`}>
                      {openIndex === index ? (
                        <Minus className="w-5 h-5 text-[#02273f]" />
                      ) : (
                        <Plus className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </button>
                  
                  {openIndex === index && (
                    <div className="px-5 pb-5">
                      <div className="pt-3 border-t border-[#b38f62]">
                        <p className="text-[#b38f62] leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
