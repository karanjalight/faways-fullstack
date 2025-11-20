"use client";
import React, { useEffect, useState } from "react";

interface CounterProps {
  target: number;
  suffix?: string;
  title: string;
}

const Counter: React.FC<CounterProps> = ({ target, suffix = "+", title }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000; // animation duration in ms
    const increment = target / (duration / 20);
    const interval = setInterval(() => {
      start += increment;
      if (start >= target) {
        start = target;
        clearInterval(interval);
      }
      setCount(Math.floor(start));
    }, 20);

    return () => clearInterval(interval);
  }, [target]);

  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-extrabold text-[#02273f]">
        {count}
        <span className="text-[#02273f]">{suffix}</span>
      </div>
      <p className="mt-2 text-[#02273f] font-medium">{title}</p>
    </div>
  );
};

const StatsSection = () => {
  // Metrics more relevant to Faways medical sales/dashboard
  const counters = [
    { target: 5, suffix: "+", title: "Years in Medical Training" },
    { target: 150, suffix: "+", title: "Clients Trained" },
    { target: 30, suffix: "+", title: "Active Dashboards" },
    { target: 10, suffix: "+", title: "Awards & Achievements" },
  ];

  return (
    <section className="py-20 bg-sky-600/90">
      <div className="lg:px-20 px-4 grid grid-cols-2 md:grid-cols-4 gap-10">
        {counters.map((item, i) => (
          <Counter
            key={i}
            target={item.target}
            suffix={item.suffix}
            title={item.title}
          />
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
