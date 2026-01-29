import { useEffect, useState } from "react";
import api from "../api/axios";
import { buildMediaUrl } from "../../utils/mediaUrl";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const res = await api.get("/events/");
      setEvents(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Loading events…
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* ================= BACKGROUND VIDEO ================= */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="fixed inset-0 w-full h-full object-cover -z-20"
        poster="/eventsBgPoster.png"
      >
        <source src="/eventsBg.mp4" type="video/mp4" />
      </video>

      {/* ================= OVERLAY ================= */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] -z-10" />

      {/* ================= CONTENT ================= */}
      <main className="text-white pt-28  relative z-10">
        <div className="max-w-6xl mx-auto px-6 space-y-24">
          {events.map(event => (
            <article key={event.id} className="rounded-2xl overflow-hidden bg-neutral-900/90 shadow-xl border border-white/10 flex flex-col md:flex-row">
              <div className="md:w-1/3 h-64 md:h-auto relative bg-black/50">
                {event.image ? (
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold tracking-widest">ROBOTECH</div>
                )}
                <div className="absolute top-4 left-4 bg-cyan-500 text-black font-bold px-3 py-1 rounded text-sm shadow-lg">
                  {new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </div>
              </div>
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{event.title}</h2>
                  {event.location && <p className="text-cyan-400 text-sm mb-4 font-semibold tracking-wide">📍 {event.location}</p>}
                  {event.description && <div className="text-gray-300 leading-relaxed mb-6 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: event.description }}></div>}
                </div>
                {event.registration_link && (
                  <div className="mt-auto pt-4">
                    <a href={event.registration_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-8 py-3 rounded-xl transition shadow-lg shadow-cyan-500/20 transform hover:-translate-y-1">
                      Register Now <i className="fa-solid fa-arrow-right"></i>
                    </a>
                  </div>
                )}
              </div>
            </article>
          ))}
          {!events.length && <div className="text-center py-20 text-gray-500 text-xl">No upcoming events found.</div>}
        </div>
      </main>

      <Footer />
    </>
  );
}
