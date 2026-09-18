
const Testimonial = () => {
  return (
    <section className="bg-green-800 py-20 px-6 text-center text-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-5xl mb-6 opacity-50">❝</div>
        <p className="text-2xl md:text-4xl font-light italic leading-relaxed mb-10">
          Agrisense completely changed how I manage my 50 acres. The disease detection caught an infection days before it could ruin my entire tomato harvest.
        </p>
        <div className="flex items-center justify-center gap-4">
          <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center text-xl font-bold border-2 border-white">
            RS
          </div>
          <div className="text-left">
            <p className="font-bold text-lg">Ramesh Singh</p>
            <p className="text-green-300 text-sm">Commercial Farmer</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;