import React, { useState } from 'react';


import Slide from './Slide';
import AIQLBackground from '../assets/AIQLBackground.png';

const Slider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "CUW AI & Quantum Innovation Lab",
      subtitle: "Department of Computer Science\nConcordia University Wisconsin",
      image: AIQLBackground,
      altText: 'AI & Quantum Innovation Lab welcome banner',
      description: `We advance education and applied research at the intersection of artificial intelligence 
        and quantum-inspired computing. Students, faculty, and partners collaborate to design, build, and 
        deploy solutions that create measurable impact across disciplines — from healthcare and business 
        analytics to engineering and the natural sciences. Join us to explore seminars, hands-on workshops, 
        and capstone projects that prepare you for the next generation of intelligent systems.`,
    },
    {
      id: 2,
      title: 'Where Intelligence Meets Computation',
      description: `From applied AI to quantum-inspired algorithms, students and researchers collaborate on 
        real-world projects. Learn modern MLOps practices, model evaluation, and responsible AI principles 
        while experimenting on classical hardware and quantum simulators. Build end‑to‑end pipelines that 
        take ideas from notebooks to production services and dashboards used by real stakeholders.`,
      images: ['Innovation1.jpg', 'Innovation2.jpg'],
      altText: ['Collaborative AI project', 'Quantum circuit visualization'],
    },
    {
      id: 3,
      title: 'Applied AI Research',
      description: `Hands‑on learning with large language models, computer vision, and agents. Work with data 
        engineering stacks, vector databases, and evaluation frameworks to create robust intelligent 
        applications. Our projects emphasize reproducibility, security, and privacy, preparing you to lead 
        AI initiatives in academia, startups, and enterprise environments.`,
      image: 'prof_Litman.png',
      altText: 'Applied AI research session',
    },
    {
      id: 4,
      title: 'Quantum Readiness',
      description: `Develop a strong foundation in quantum information and algorithms. Explore circuit models, 
        optimization methods, and hybrid workflows that combine classical ML with quantum techniques. 
        Get practical experience using SDKs and simulators while learning when quantum provides an advantage 
        — and how to evaluate trade‑offs in real use cases.`,
      image: 'prof_Yiming.png',
      altText: 'Quantum learning and experimentation',
    },
  ];

  const handleNext = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + slides.length) % slides.length);
  };

  // Accessibility: auto-advance with pause on hover and keyboard navigation
  const [isPaused, setIsPaused] = React.useState(false);
  React.useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000); // 7s per slide
    return () => clearInterval(id);
  }, [isPaused, slides.length]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
  };

  const goToSlide = (idx) => setCurrentSlide(idx);

  return (
    <div className="absolute inset-0 flex items-center justify-center "
         onMouseEnter={() => setIsPaused(true)}
         onMouseLeave={() => setIsPaused(false)}
         onKeyDown={handleKeyDown}
         tabIndex={0}
         aria-label="AI & Quantum Innovation Lab highlights carousel">
      <div className="w-[95%] md:h-[80%] min-h-[70svh] bg-[#115175] rounded-xl shadow-xl relative pb-16">

        {slides.map((slide, index) => (
          <Slide
            key={index}
            slide={slide}
            visible={index === currentSlide}
          />
        ))}
        {/* Bottom controls: prev, dots, next */}
        <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
          <button
            onClick={handlePrev}
            aria-label="Previous slide"
            className="bg-white/90 hover:bg-white text-black w-8 h-8 grid place-items-center rounded-full shadow focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <span aria-hidden="true" className="-mt-0.5">‹</span>
          </button>

          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`${idx === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/80'} w-2.5 h-2.5 rounded-full transition-colors`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            aria-label="Next slide"
            className="bg-white/90 hover:bg-white text-black w-8 h-8 grid place-items-center rounded-full shadow focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <span aria-hidden="true" className="-mt-0.5">›</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Slider;