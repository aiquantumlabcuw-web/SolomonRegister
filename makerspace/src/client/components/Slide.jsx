import React from 'react';
 
const Slide = ({ slide, visible }) => {
  const { title, subtitle, description, image, images, altText } = slide;

  if (!visible) return null;

  return (
    <div className="relative flex items-center justify-center h-full">
      <div className="relative grid grid-cols-1 md:grid-cols-12 items-center h-full w-full p-4 sm:p-5 md:p-8 gap-3 sm:gap-4 md:gap-6">
        {/* Text Content */}
        <div className="md:col-span-7 m-1 md:m-2 p-3 md:p-4 text-white text-sm sm:text-base flex flex-col justify-center max-w-[64rem] space-y-3 md:space-y-4 max-h-[calc(70svh-4rem)] md:max-h-none overflow-y-auto pr-1 sm:pr-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base sm:text-lg text-slate-100/90">
              {subtitle.split('\n').map((line, idx) => (
                <span key={idx}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          )}
          {description && (
            <p className="text-slate-100/95 leading-relaxed md:text-lg">
              {description}
            </p>
          )}
        </div>

        {/* Image Content */}
        <div className="hidden md:flex md:col-span-5 items-center justify-center">
          {image && (
            <img
              src={image}
              alt={typeof altText === 'string' ? altText : 'Slide image'}
              className="w-[88%] sm:w-96 2xl:w-[80%] h-auto rounded-lg shadow-lg md:mr-2 object-contain bg-black/10"
            />
          )}

          <div className="hidden sm:flex items-start gap-2">
            {images &&
              images.map((img, idx) => (
                <div key={idx}>
                  <img
                    src={img}
                    alt={Array.isArray(altText) ? altText[idx] : `Slide image ${idx + 1}`}
                    className="mt-2 sm:mt-0 block w-40 sm:w-48 2xl:w-64 h-auto rounded-lg shadow-lg object-cover bg-black/10"
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Slide;