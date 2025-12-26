import React, { useState, useEffect } from "react";

/* =======================
   IMAGE IMPORTS
   ======================= */

// additional
import additional1 from "./our-partner/additional1.jpeg";
import additional2 from "./our-partner/additional2.jpeg";
import additional3 from "./our-partner/additional3.jpeg";
import additional4 from "./our-partner/additional4.jpeg";
import additional5 from "./our-partner/additional5.jpeg";
import additional6 from "./our-partner/additional6.jpeg";

// awards
import award1 from "./our-partner/award1.jpeg";
import award2 from "./our-partner/award2.jpeg";
import award3 from "./our-partner/award3.jpeg";

// clean
import clean1 from "./our-partner/clean1.jpeg";
import clean2 from "./our-partner/clean2.jpeg";
import clean3 from "./our-partner/clean3.jpeg";
import clean4 from "./our-partner/clean4.jpeg";
import clean5 from "./our-partner/clean5.jpeg";
import clean6 from "./our-partner/clean6.jpeg";
import clean7 from "./our-partner/clean7.jpeg";
import clean8 from "./our-partner/clean8.jpeg";
import clean9 from "./our-partner/clean9.jpeg";
import clean10 from "./our-partner/clean10.jpeg";
import clean11 from "./our-partner/clean11.jpeg";
import clean12 from "./our-partner/clean12.jpeg";

// garbage
import garbage1 from "./our-partner/garbage1.jpeg";
import garbage2 from "./our-partner/garbage2.jpeg";
import garbage3 from "./our-partner/garbage3.jpeg";
import garbage4 from "./our-partner/garbage4.jpeg";

// news
import news1 from "./our-partner/news1.jpeg";
import news2 from "./our-partner/news2.jpeg";
import news3 from "./our-partner/news3.jpeg";
import news4 from "./our-partner/news4.jpeg";
import news5 from "./our-partner/news5.jpeg";
import news6 from "./our-partner/news6.jpeg";
import news7 from "./our-partner/news7.jpeg";
import news8 from "./our-partner/news8.jpeg";
import news9 from "./our-partner/news9.jpeg";

// office
import office1 from "./our-partner/office1.jpeg";
import office2 from "./our-partner/office2.jpeg";
import office3 from "./our-partner/office3.jpeg";
import office4 from "./our-partner/office4.jpeg";
import office5 from "./our-partner/office5.jpeg";
import office6 from "./our-partner/office6.jpeg";
import office7 from "./our-partner/office7.jpeg";
import office8 from "./our-partner/office8.jpeg";
import office9 from "./our-partner/office9.jpeg";
import office10 from "./our-partner/office10.jpeg";
import office11 from "./our-partner/office11.jpeg";
import office12 from "./our-partner/office12.jpeg";
import office13 from "./our-partner/office13.jpeg";
import office14 from "./our-partner/office14.jpeg";
import office15 from "./our-partner/office15.jpeg";
import office16 from "./our-partner/office16.jpeg";

// public
import public1 from "./our-partner/public1.jpeg";
import public2 from "./our-partner/public2.jpeg";

/* =======================
   SLIDER DATA
   ======================= */

const galleryImages = [
  additional1, additional2, additional3, additional4, additional5, additional6,
  award1, award2, award3,
  clean1, clean2, clean3, clean4, clean5, clean6, clean7, clean8, clean9, clean10, clean11, clean12,
  garbage1, garbage2, garbage3, garbage4,
  news1, news2, news3, news4, news5, news6, news7, news8, news9,
  office1, office2, office3, office4, office5, office6, office7, office8, office9, office10,
  office11, office12, office13, office14, office15, office16,
  public1, public2
];

const Impact = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === galleryImages.length - 1 ? 0 : prev + 1
      );
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-2 text-blue-600">Our Impact</h1>
      <p className="text-gray-600 mb-10 text-lg">
        Visualizing progress through real field activity and waste collection.
      </p>

      {/* SLIDER */}
      <div className="relative w-full h-[500px] overflow-hidden rounded-2xl shadow-2xl mb-14 bg-black">

        {/* LEFT BUTTON */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center"
        >
          ❮
        </button>

        {/* RIGHT BUTTON */}
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center"
        >
          ❯
        </button>

        {galleryImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={img}
              alt={`Impact ${index + 1}`}
              className="w-full h-full object-contain bg-white"
            />

            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent text-white">
              <span className="bg-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase mb-3 inline-block">
                Field Activity
              </span>
              <h2 className="text-2xl md:text-3xl font-bold">
                Waste Management Ground Operations
              </h2>
            </div>
          </div>
        ))}

        {/* DOTS */}
        <div className="absolute bottom-4 right-6 flex space-x-2">
          {galleryImages.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-blue-500 w-6"
                  : "bg-gray-400 w-2"
              }`}
            />
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="p-6 bg-white rounded-xl shadow border">
          <h3 className="text-4xl font-extrabold text-blue-600 mb-2">40%</h3>
          <p className="text-gray-600">Reduction in illegal dumping</p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow border">
          <h3 className="text-4xl font-extrabold text-blue-600 mb-2">500+</h3>
          <p className="text-gray-600">GVPs monitored monthly</p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow border">
          <h3 className="text-4xl font-extrabold text-blue-600 mb-2">12</h3>
          <p className="text-gray-600">Active wards covered</p>
        </div>
      </div>
    </div>
  );
};

export default Impact;
