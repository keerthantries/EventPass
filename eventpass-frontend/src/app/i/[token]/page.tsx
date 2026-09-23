"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import QRCode from "qrcode";
import { useInvitation } from "@/hooks/queries";
import { cn } from "@/lib/utils";

function QrCodeImage({ token, size = 180 }: { token: string; size?: number }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    QRCode.toDataURL(token, {
      width: size,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [token, size]);

  if (!src) {
    return <div className="rounded-lg bg-white/10" style={{ width: size, height: size }} />;
  }

  return <img src={src} alt="QR code" width={size} height={size} className="rounded-lg" />;
}

function formatDateParts(dateString: string): { dayName: string; month: string; dayNumber: number; year: number } {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { dayName: "", month: "", dayNumber: 0, year: 0 };
  }
  const dayName = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }).toUpperCase();
  const month = date.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" }).toUpperCase();
  const dayNumber = date.getUTCDate();
  const year = date.getUTCFullYear();
  return { dayName, month, dayNumber, year };
}

function Particles() {
  const particles = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: (i * 4.2 + 2) % 100,
      size: 3 + (i % 4) * 1.5,
      duration: 10 + (i % 6) * 2.5,
      delay: (i * 0.6) % 10,
      drift: -40 + (i % 7) * 12,
    })),
  []);

  return (
    <div className="particles-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { data, isLoading, isError } = useInvitation(token);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="error-container">
        <XCircle className="error-icon" />
        <h1 className="error-title">Invitation Not Found</h1>
        <p className="error-text">
          This invite link is invalid or has expired. Please contact the event organizer.
        </p>
      </div>
    );
  }

  const { event: eventData, guest } = data;
  const websiteUrl = eventData.weddingWebsiteUrl || "#";
  const { dayName, month, dayNumber, year } = formatDateParts(eventData.startDate);

  const brideName = eventData.brideName || "Ikram Halane";
  const groomName = eventData.groomName || "Nebil Yusuf";
  const venue = eventData.venue || "Woodbine Banquet Hall";
  const venueAddress = eventData.venueAddress || "30 Vice Regent Blvd, Etobicoke, ON M9W 7A4";
  const guestArrivalTime = eventData.guestArrivalTime || "6:00PM";
  const quranVerse = eventData.quranVerse || "\"AND WE CREATED YOU IN PAIRS.\"";
  const quranReference = eventData.quranReference || "QURAN 78:8";
  const bismillahImageUrl = eventData.bismillahImageUrl || "https://res.cloudinary.com/cvuqo9hg/image/upload/v1789584106/Gemini_Generated_Image_7xmguy7xmguy7xmg-removebg-preview.png";
  const invitationMessage = eventData.invitationMessage || "TOGETHER WITH OUR FAMILIES, WE REQUEST THE HONOUR OF YOUR PRESENCE TO CELEBRATE THE WEDDING OF";

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap"
        rel="stylesheet"
      />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #e5e5e5; font-family: "Cinzel", serif; }

        .loading-container {
          background: linear-gradient(135deg, #f5f0e6 0%, #e5e5e5 50%, #f5f0e6 100%);
          display: flex; justify-content: center; align-items: center; min-height: 100vh;
        }
        .spinner {
          width: 40px; height: 40px; border: 2px solid #c59b27;
          border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-container {
          background: linear-gradient(135deg, #f5f0e6 0%, #e5e5e5 50%, #f5f0e6 100%);
          display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px;
        }
        .error-icon { width: 48px; height: 48px; color: #ef4444; margin: 0 auto; }
        .error-title { margin-top: 16px; font-size: 20px; font-weight: 600; color: #1f2937; text-align: center; }
        .error-text { margin-top: 8px; font-size: 14px; color: #6b7280; text-align: center; }

        .invite-page {
          background: linear-gradient(160deg, #f5f0e6 0%, #e8e2d4 30%, #ddd6c6 60%, #e8e2d4 100%);
          display: flex; justify-content: center; align-items: center;
          min-height: 100vh; padding: 20px; font-family: "Cinzel", serif;
          position: relative;
        }

        .invite-page::before {
          content: "";
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 20% 20%, rgba(197,155,39,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(197,155,39,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.03) 0%, transparent 70%);
          pointer-events: none;
        }

        .invite-wrapper {
          display: flex; flex-direction: column; align-items: center; gap: 20px;
          width: 100%; max-width: 500px; position: relative; z-index: 2;
        }

        /* Particles */
        .particles-container {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          pointer-events: none; z-index: 1; overflow: hidden;
        }
        .particle {
          position: absolute; bottom: -10px;
          background: radial-gradient(circle, #d4af37 0%, #c59b27 40%, rgba(197,155,39,0.3) 70%, transparent 100%);
          border-radius: 50%; opacity: 0; animation: floatUp linear infinite;
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(0) translateX(0) scale(0.3); }
          8% { opacity: 0.9; }
          85% { opacity: 0.5; }
          100% { opacity: 0; transform: translateY(-105vh) translateX(var(--drift, 0px)) scale(1); }
        }

        /* Staggered Fade-In */
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { opacity: 0; animation: fadeSlideUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .delay-1 { animation-delay: 0.15s; }
        .delay-2 { animation-delay: 0.35s; }
        .delay-3 { animation-delay: 0.55s; }
        .delay-4 { animation-delay: 0.75s; }
        .delay-5 { animation-delay: 0.95s; }
        .delay-6 { animation-delay: 1.15s; }
        .delay-7 { animation-delay: 1.35s; }

        /* Border Glow */
        @keyframes borderGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(197,155,39,0.15), inset 0 0 10px rgba(197,155,39,0.03); }
          50% { box-shadow: 0 0 22px rgba(197,155,39,0.35), inset 0 0 15px rgba(197,155,39,0.08); }
        }

        /* Heartbeat */
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.25); }
          30% { transform: scale(1); }
          45% { transform: scale(1.18); }
          60% { transform: scale(1); }
        }
        .heart-icon {
          display: inline-block; font-size: 18px;
          animation: heartbeat 1.5s ease-in-out infinite;
          filter: drop-shadow(0 0 6px rgba(197,155,39,0.5));
        }

        .gold-text {
          color: #b58d3d;
          background: linear-gradient(135deg, #9a7428 0%, #d4af37 40%, #8a641c 70%, #c59b27 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .card {
          background-color: #fcfbfa; width: 100%; max-width: 460px; padding: 15px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.10), 0 2px 10px rgba(197,155,39,0.08);
          aspect-ratio: 1 / 1.35; display: flex; flex-direction: column;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
          position: relative;
        }

        .card-inner-border {
          border: 2.5px solid #c59b27; padding: 18px 20px; position: relative;
          text-align: center; height: 100%; display: flex; flex-direction: column;
          justify-content: space-between; align-items: center;
          animation: borderGlow 3s ease-in-out infinite;
          overflow: hidden;
        }
        .card-inner-border::before {
          content: ""; position: absolute; top: 3px; left: 3px; right: 3px; bottom: 3px;
          border: 2.5px solid #c59b27; pointer-events: none;
        }

        .bismillah-img-container { margin-bottom: 4px; width: 100%; display: flex; justify-content: center; }
        .bismillah-img { max-width: 160px; width: 100%; height: auto; display: block; }

        .quran-quote { font-family: "Cinzel", serif; font-size: 8.5px; letter-spacing: 1.2px; margin-bottom: 2px; font-weight: 600; }
        .quran-ref { font-family: "Cinzel", serif; font-size: 8px; letter-spacing: 1px; margin-bottom: 12px; font-weight: 600; }

        .invitation-text { font-family: "Cinzel", serif; font-size: 8.5px; letter-spacing: 1.2px; line-height: 1.6; max-width: 320px; margin-bottom: 8px; font-weight: 600; }

        .names-container { margin-bottom: 12px; }
        .name { font-family: "Alex Brush", cursive; font-size: 44px; line-height: 1.05; font-weight: 400; text-transform: capitalize; }
        .ampersand { font-family: "Alex Brush", cursive; font-size: 28px; margin: 2px 0; display: block; }

        .date-container { display: flex; flex-direction: column; align-items: center; margin-bottom: 12px; }
        .day-name { font-family: "Cinzel", serif; font-size: 10.5px; letter-spacing: 2px; font-weight: 600; margin-bottom: 2px; }
        .date-row { display: flex; align-items: center; justify-content: center; gap: 10px; }
        .date-block { display: flex; flex-direction: column; align-items: center; width: 80px; }
        .date-block span { font-family: "Cinzel", serif; font-size: 10.5px; letter-spacing: 2px; font-weight: 600; padding: 2px 0; }
        .date-line { width: 100%; height: 1px; background: linear-gradient(90deg, transparent, #c59b27, transparent); }
        .day-number { font-family: "Playfair Display", serif; font-size: 38px; font-weight: 400; line-height: 1; }
        .guest-arrival { font-family: "Cinzel", serif; font-size: 8.5px; letter-spacing: 1.5px; margin-top: 4px; font-weight: 600; }

        .venue-container { margin-top: 2px; }
        .venue-name { font-family: "Alex Brush", cursive; font-size: 24px; margin-bottom: 2px; }
        .venue-address {
          font-family: "Playfair Display", serif; font-style: italic; font-size: 11.5px;
          letter-spacing: 0.5px; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word;
          hyphens: auto; max-width: 100%;
        }

        .guest-card {
          background-color: #fcfbfa; width: 100%; max-width: 460px; padding: 16px 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.06); text-align: center;
          border: 1px solid rgba(197,155,39,0.2); border-radius: 12px;
          transition: transform 0.3s ease;
        }
        .guest-card:hover { transform: translateY(-2px); }
        .guest-card-label { font-family: "Cinzel", serif; font-size: 9px; letter-spacing: 2px; font-weight: 600; margin-bottom: 4px; }
        .guest-card-name { font-family: "Alex Brush", cursive; font-size: 28px; line-height: 1.2; }

        .qr-section {
          background-color: #fcfbfa; width: 100%; max-width: 460px; padding: 24px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.06); text-align: center;
          border: 1px solid rgba(197,155,39,0.2); border-radius: 12px;
        }
        .qr-label { font-family: "Cinzel", serif; font-size: 9px; letter-spacing: 2px; font-weight: 600; margin-bottom: 16px; }
        .qr-wrapper {
          display: inline-block; padding: 16px; background: white;
          border: 2px solid #c59b27; border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08), 0 0 10px rgba(197,155,39,0.1);
        }
        .qr-name { font-family: "Alex Brush", cursive; font-size: 22px; margin-top: 12px; }
        .qr-date { font-family: "Cinzel", serif; font-size: 10px; color: #6b7280; margin-top: 4px; }
        .qr-note { font-family: "Cinzel", serif; font-size: 9px; color: #9ca3af; margin-top: 12px; letter-spacing: 0.5px; }

        .rsvp-accepted, .rsvp-declined, .rsvp-maybe {
          padding: 12px 20px; border-radius: 12px; font-family: "Cinzel", serif;
          font-size: 12px; font-weight: 600; display: flex; align-items: center;
          justify-content: center; gap: 8px; width: 100%; max-width: 460px;
        }
        .rsvp-accepted { background-color: #dcfce7; color: #166534; border: 1px solid rgba(22,101,52,0.15); }
        .rsvp-declined { background-color: #fee2e2; color: #991b1b; border: 1px solid rgba(153,27,27,0.15); }
        .rsvp-maybe { background-color: #fef9c3; color: #854d0e; border: 1px solid rgba(133,77,14,0.15); }

        .website-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; max-width: 460px; padding: 16px 24px; background-color: #fcfbfa;
          border: 2px solid #c59b27; border-radius: 12px; text-decoration: none;
          font-family: "Cinzel", serif; font-size: 11px; font-weight: 600; letter-spacing: 1px;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 4px 15px rgba(0,0,0,0.06);
        }
        .website-btn:hover {
          background: linear-gradient(135deg, #f5f0e6, #fcfbfa);
          box-shadow: 0 6px 20px rgba(197,155,39,0.15);
          transform: translateY(-2px);
        }
        .website-btn-icon { width: 16px; height: 16px; }

        .footer-text { font-family: "Cinzel", serif; font-size: 10px; color: #b0a898; letter-spacing: 1px; }
      `}</style>

      <div className="invite-page">
        <Particles />
        <div className="invite-wrapper">
          <div className="card animate-fade-in delay-1">
            <div className="card-inner-border">
              <div className="animate-fade-in delay-2">
                {bismillahImageUrl && (
                  <div className="bismillah-img-container">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bismillahImageUrl} alt="bismillah" className="bismillah-img" />
                  </div>
                )}
                <div className="quran-quote gold-text">
                  -IN THE NAME OF ALLAH, THE MOST BENEFICENT AND THE MOST MERCIFUL
                </div>
                <br />
                <div className="quran-quote gold-text">{quranVerse}</div>
                <div className="quran-ref gold-text">{quranReference}</div>
              </div>

              <div className="invitation-text gold-text animate-fade-in delay-3">{invitationMessage}</div>

              <div className="names-container animate-fade-in delay-4">
                <div className="name gold-text">{brideName}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "2px 0" }}>
                  <span className="heart-icon gold-text">♥</span>
                </div>
                <div className="name gold-text">{groomName}</div>
              </div>

              <div className="date-container gold-text animate-fade-in delay-5">
                <div className="day-name">{dayName}</div>
                <div className="date-row">
                  <div className="date-block">
                    <div className="date-line" />
                    <span>{month}</span>
                    <div className="date-line" />
                  </div>
                  <div className="day-number">{dayNumber}</div>
                  <div className="date-block">
                    <div className="date-line" />
                    <span>{year}</span>
                    <div className="date-line" />
                  </div>
                </div>
                {guestArrivalTime && (
                  <div className="guest-arrival">GUEST ARRIVAL {guestArrivalTime}</div>
                )}
              </div>

              <div className="venue-container animate-fade-in delay-6">
                <div className="venue-name gold-text">{venue}</div>
                {venueAddress && (
                  <div className="venue-address gold-text">{venueAddress}</div>
                )}
              </div>
            </div>
          </div>

          <div className="guest-card animate-fade-in delay-5">
            <div className="guest-card-label gold-text">THIS CARD IS PREPARED FOR</div>
            <div className="guest-card-name gold-text">{guest.fullName}</div>
          </div>

          {guest.qrToken && (
            <div className="qr-section animate-fade-in delay-6">
              <div className="qr-label gold-text">YOUR PERSONAL WEDDING PASS</div>
              <div className="qr-wrapper">
                <QrCodeImage token={guest.qrToken} size={180} />
              </div>
              <div className="qr-name gold-text">{guest.fullName}</div>
              <div className="qr-date">{dayName} {month} {dayNumber}, {year}</div>
              <div className="qr-note">This QR code is unique to you. Please have it available upon arrival.</div>
            </div>
          )}

          {guest.rsvpStatus !== "pending" && (
            <div className={cn(
              guest.rsvpStatus === "accepted" ? "rsvp-accepted" : guest.rsvpStatus === "declined" ? "rsvp-declined" : "rsvp-maybe",
              "animate-fade-in delay-6"
            )}>
              {guest.rsvpStatus === "accepted" && (
                <>
                  <CheckCircle2 style={{ width: 16, height: 16 }} />
                  You&apos;re Going!
                </>
              )}
              {guest.rsvpStatus === "declined" && "Response Recorded"}
              {guest.rsvpStatus === "maybe" && "Maybe"}
            </div>
          )}

          {websiteUrl && websiteUrl !== "#" && (
            <Link href={websiteUrl} target="_blank" className="website-btn gold-text animate-fade-in delay-7">
              <ExternalLink className="website-btn-icon" style={{ WebkitTextFillColor: "#c59b27" }} />
              <span>VIEW WEDDING WEBSITE</span>
            </Link>
          )}

          <div className="footer-text animate-fade-in delay-7">Powered by EventPass</div>
        </div>
      </div>
    </>
  );
}
