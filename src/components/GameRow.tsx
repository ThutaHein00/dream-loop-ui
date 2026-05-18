type Item = {
  id: string;
  title: string;
  badge?: string;
  price: number;
  oldPrice?: number;
  imageUrl: string;
};

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function GameRow({
  title,
  rightText,
  items,
}: {
  title: string;
  rightText?: string;
  items: Item[];
}) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-[#C7432C]">{title}</h2>
        {rightText ? (
          <button className="btn btn-link no-underline text-[#C7432C]">
            {rightText} →
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {items.map((g) => (
          <div
            key={g.id}
            className="min-w-60 max-w-60 rounded-2xl bg-white shadow-md border border-black/5 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition"
          >
            <div className="relative">
              <img
                src={g.imageUrl}
                alt={g.title}
                className="w-full h-36 object-cover"
              />
              {g.badge && (
                <div className="absolute top-2 left-2 px-3 py-1 rounded-full bg-[#E60012] text-white text-xs font-bold">
                  {g.badge}
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="font-extrabold text-neutral-900 leading-tight line-clamp-2">
                {g.title}
              </div>

              <div className="mt-2 flex items-end justify-between">
                <div>
                  {g.oldPrice && (
                    <div className="text-xs text-neutral-400 line-through">
                      {money(g.oldPrice)}
                    </div>
                  )}
                  <div className="text-lg font-extrabold text-[#C7432C]">
                    {money(g.price)}
                  </div>
                </div>

                <button className="btn btn-sm bg-[#E60012] hover:bg-[#cc0010] border-none text-white rounded-xl">
                  Buy
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
