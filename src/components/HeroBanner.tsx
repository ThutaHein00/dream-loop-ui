export default function HeroBanner() {
  return (
    <section className="mt-5 rounded-3xl overflow-hidden bg-white shadow-lg border border-black/5">
      <div className="relative">
        <img
          src="https://picsum.photos/seed/froggy/1400/650"
          alt="Featured Banner"
          className="w-full h-65 md:h-90 object-cover"
        />

        <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-black/20" />

        <div className="absolute left-6 bottom-6 right-6">
          <div className="text-white drop-shadow">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Froggy <br /> Adventure
            </h1>
            <p className="mt-2 text-white/95 max-w-xl">
              Embark on an exciting adventure with Froggy and friends!
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button className="btn bg-[#E60012] hover:bg-[#cc0010] border-none text-white rounded-xl px-8">
                Buy Now
              </button>
              <button className="btn bg-white/15 hover:bg-white/20 border border-white/25 text-white rounded-xl px-8">
                ▶ Watch Trailer
              </button>

              <div className="ml-auto md:ml-0 md:absolute md:right-6 md:bottom-6">
                <div className="px-5 py-2 rounded-full bg-[#FFC400] text-black font-extrabold shadow">
                  Out Now!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-linear-to-r from-[#FFF3E6] to-[#FFF9F3] text-neutral-700">
        Welcome to your cozy game store — discover new adventures every day.
      </div>
    </section>
  );
}
