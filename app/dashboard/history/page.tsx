import { createClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const supabase = await createClient();
  const result = await supabase
    .from("generations")
    .select("*")
    .order("created_at", { ascending: false });

  const data = result.data || [];

  console.log("ROWS:", data.length);
  console.log(data);

  return (
    <div className="p-8 text-white">
      <h1 className="mb-6 text-3xl font-bold">
        Generation History
      </h1>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <p>No generations found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((item: any) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-6"
            >
              <h2 className="mb-2 text-lg font-bold">
                {item.product_description}
              </h2>

              <p className="mb-4 text-sm text-gray-400">
                {new Date(item.created_at).toLocaleString()}
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Hooks</h3>
                  {item.hooks?.map((hook: string, i: number) => (
                    <div
                      key={i}
                      className="mb-2 rounded bg-white/5 p-2"
                    >
                      {hook}
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Captions</h3>
                  {item.captions?.map((caption: string, i: number) => (
                    <div
                      key={i}
                      className="mb-2 rounded bg-white/5 p-2"
                    >
                      {caption}
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">CTAs</h3>
                  {item.ctas?.map((cta: string, i: number) => (
                    <div
                      key={i}
                      className="mb-2 rounded bg-white/5 p-2"
                    >
                      {cta}
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">UGC Script</h3>
                  <div className="rounded bg-white/5 p-3 whitespace-pre-wrap">
                    {item.ugc_script}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}