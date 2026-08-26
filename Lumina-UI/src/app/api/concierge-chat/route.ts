import { NextResponse } from 'next/server';

const N8N_CONCIERGE_WEBHOOK =
  process.env.N8N_CONCIERGE_WEBHOOK_URL ||
  'https://dummyaccountbry.app.n8n.cloud/webhook/concierge-chat';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, session_id } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'A valid query string is required.' },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim().slice(0, 300);
    const lowerQuery = trimmedQuery.toLowerCase();

    // 1. Critical Emergency Red-Flag Triage Check
    const isEmergency =
      lowerQuery.includes('uncontrolled bleeding') ||
      lowerQuery.includes('heavy bleeding') ||
      lowerQuery.includes('severe swelling') ||
      lowerQuery.includes('cannot breathe') ||
      lowerQuery.includes('difficulty breathing') ||
      lowerQuery.includes('broken jaw') ||
      lowerQuery.includes('severe trauma');

    if (isEmergency) {
      return NextResponse.json({
        status: 'emergency',
        bot_name: 'Lumi',
        reply:
          '🚨 **URGENT CLINICAL ALERT:** If you are experiencing severe swelling, difficulty breathing, or uncontrolled bleeding, please seek immediate emergency care or call our 24/7 Clinical Emergency Line right away:\n\n📞 **(02) 8888-LUMI (5864)** • **+63 917 123 4567**\n\nOur attending dentists are on standby for acute emergencies.',
        matched_chunks: 1,
        session_id: session_id || 'emergency-session',
      });
    }

    // 2. Try proxying to live n8n webhook (Workflow 7)
    try {
      const n8nRes = await fetch(N8N_CONCIERGE_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmedQuery,
          session_id: session_id || `web-session-${Date.now()}`,
        }),
        signal: AbortSignal.timeout(6000), // 6s timeout for fast response
      });

      if (n8nRes.ok) {
        const data = await n8nRes.json();
        return NextResponse.json({
          status: 'success',
          bot_name: data.bot_name || 'Lumi',
          reply: data.reply || data.response || data.message,
          matched_chunks: data.matched_chunks || 2,
          session_id: data.session_id || session_id,
        });
      }
    } catch (n8nErr) {
      console.warn('[Concierge API] n8n webhook unreachable, using grounded clinical fallback:', n8nErr);
    }

    // 3. Grounded Fallback Engine (Strictly adhering to Lumina Dental Studio 2026 SOPs)
    let fallbackReply =
      "I’m Lumi, your 24/7 Lumina Dental Concierge! How can I assist you with our services, transparent pricing, clinic schedule, or post-treatment recovery today?";

    if (
      lowerQuery.includes('hour') ||
      lowerQuery.includes('time') ||
      lowerQuery.includes('open') ||
      lowerQuery.includes('schedule') ||
      lowerQuery.includes('sunday')
    ) {
      fallbackReply =
        "We’re open to serve you at our BGC, Ortigas, and Alabang studios!\n\n" +
        "🕒 **Monday – Friday:** 9:00 AM – 7:00 PM\n" +
        "🕒 **Saturday:** 9:00 AM – 3:00 PM\n" +
        "🙂 **Sundays:** Closed (Staff Rest Day)\n\n" +
        "Would you like me to help you reserve an appointment slot?";
    } else if (
      lowerQuery.includes('whitening') ||
      lowerQuery.includes('bleach') ||
      lowerQuery.includes('laser')
    ) {
      fallbackReply =
        "✨ **Laser Teeth Whitening (Philips Zoom / Dual-Light):**\n\n" +
        "• **In-Clinic Laser Whitening:** ₱15,000 – ₱22,000 (Target: 4–8 shades brighter in 1 session)\n" +
        "• **Take-Home Professional Kit:** ₱8,500 (Includes custom precision trays + 4 syringes)\n\n" +
        "Includes a complimentary shade assessment and enamel protection gel!";
    } else if (
      lowerQuery.includes('cleaning') ||
      lowerQuery.includes('prophylaxis') ||
      lowerQuery.includes('deep scaling') ||
      lowerQuery.includes('checkup')
    ) {
      fallbackReply =
        "🩺 **Preventive Oral Care & Hygiene:**\n\n" +
        "• **Comprehensive Exam & Digital Charting:** ₱1,200 (100% HMO Covered)\n" +
        "• **Standard Dental Cleaning (Prophylaxis):** ₱2,500 – ₱3,500\n" +
        "• **Air-Flow Master® Polish Add-on:** ₱1,800\n" +
        "• **Deep Scaling & Root Planing:** ₱3,500 / quadrant\n\n" +
        "We recommend a routine cleaning every 6 months to maintain optimal gum health.";
    } else if (
      lowerQuery.includes('wisdom') ||
      lowerQuery.includes('extraction') ||
      lowerQuery.includes('surgery') ||
      lowerQuery.includes('odontectomy')
    ) {
      fallbackReply =
        "🦷 **Wisdom Tooth Removal & Surgery:**\n\n" +
        "• **Simple Extraction:** ₱2,500 – ₱4,000\n" +
        "• **Surgical Wisdom Tooth Odontectomy:** ₱12,000 – ₱25,000 (depending on impaction class)\n" +
        "• **Socket Preservation Bone Grafting:** ₱15,000 – ₱22,000\n\n" +
        "All surgical procedures include local pain management and our digital post-op care sequence.";
    } else if (
      lowerQuery.includes('bleeding') ||
      lowerQuery.includes('post-op') ||
      lowerQuery.includes('after extraction') ||
      lowerQuery.includes('swelling') ||
      lowerQuery.includes('dry socket')
    ) {
      fallbackReply =
        "🩹 **Post-Operative Extraction Care:**\n\n" +
        "1. **Bite Firmly on Gauze:** Keep steady pressure for 45–60 minutes. If oozing persists, a moistened black tea bag works wonders (tannic acid aids clotting).\n" +
        "2. **Strict Prohibitions:** NO straws, NO smoking/vaping, and NO vigorous spitting for 72 hours to prevent dry socket.\n" +
        "3. **Cold Compress:** Apply ice to your cheek (20 mins ON, 20 mins OFF) for the first 24 hours.\n\n" +
        "If heavy bleeding persists after 4 hours, call our 24/7 desk at **(02) 8888-LUMI**.";
    } else if (
      lowerQuery.includes('white diet') ||
      lowerQuery.includes('eat after whitening') ||
      lowerQuery.includes('coffee')
    ) {
      fallbackReply =
        "☕ **The 48-Hour 'White Diet' After Whitening:**\n\n" +
        "Your enamel pores remain open for 48 hours. Please follow these guidelines:\n\n" +
        "✅ **Eat/Drink:** Water, skim milk, white rice, skinless chicken, white fish, plain yogurt, pasta with cream sauce, bananas.\n" +
        "❌ **Strictly Avoid:** Coffee, black/green tea, red wine, soy sauce, curries, tomato sauce, berries, dark sodas, and smoking.";
    } else if (
      lowerQuery.includes('hmo') ||
      lowerQuery.includes('insurance') ||
      lowerQuery.includes('maxicare') ||
      lowerQuery.includes('medicard') ||
      lowerQuery.includes('intellicare') ||
      lowerQuery.includes('philcare') ||
      lowerQuery.includes('etiqa')
    ) {
      fallbackReply =
        "💳 **Accredited HMO & Insurance Underwriters:**\n\n" +
        "We support direct billing and digital verification for:\n" +
        "• **Maxicare Healthcare**\n" +
        "• **Intellicare / Asalus**\n" +
        "• **Medicard Philippines**\n" +
        "• **PhilCare**\n" +
        "• **Etiqa Life & General**\n" +
        "• **CareHealth Plus**\n" +
        "• **Cigna Global & Bupa**\n\n" +
        "Please present your physical or digital HMO card and 1 valid ID at check-in!";
    } else if (
      lowerQuery.includes('location') ||
      lowerQuery.includes('where') ||
      lowerQuery.includes('branch') ||
      lowerQuery.includes('bgc') ||
      lowerQuery.includes('address')
    ) {
      fallbackReply =
        "📍 **Lumina Dental Studio Branches:**\n\n" +
        "1. **BGC (Main Studio):** 3rd Floor, High Street South Corporate Plaza, Bonifacio Global City, Taguig\n" +
        "2. **Ortigas Center:** Suite 1402, One Corporate Centre, Julia Vargas Ave, Pasig City\n" +
        "3. **Alabang:** 2nd Level, Commerce Center, Filinvest City, Muntinlupa\n\n" +
        "Phone: **(02) 8888-LUMI (5864)** • Mobile: **+63 917 123 4567**";
    } else if (
      lowerQuery.includes('price') ||
      lowerQuery.includes('cost') ||
      lowerQuery.includes('rates') ||
      lowerQuery.includes('fee')
    ) {
      fallbackReply =
        "💎 **Official 2026 Transparent Fee Schedule:**\n\n" +
        "• **Consultation & X-Rays:** ₱1,200 (100% HMO Covered)\n" +
        "• **Prophylaxis (Cleaning):** ₱2,500 – ₱3,500\n" +
        "• **Composite Filling:** ₱2,000 – ₱2,500\n" +
        "• **Laser Teeth Whitening:** ₱15,000 – ₱22,000\n" +
        "• **Wisdom Tooth Surgery:** ₱12,000 – ₱25,000\n" +
        "• **Porcelain Veneers:** ₱22,000 – ₱28,000/unit\n" +
        "• **Lumina Clear Aligners:** ₱85,000 – ₱210,000 (0% installment available)\n\n" +
        "Which procedure would you like detailed information on?";
    }

    return NextResponse.json({
      status: 'success',
      bot_name: 'Lumi',
      reply: fallbackReply,
      matched_chunks: 2,
      session_id: session_id || 'web-session',
    });
  } catch (err: unknown) {
    console.error('[Concierge API] Error:', err);
    return NextResponse.json(
      {
        error: 'Failed to process concierge inquiry.',
        reply:
          "I apologize, I'm experiencing a brief connectivity hiccup. Please reach our clinic reception directly at (02) 8888-LUMI (5864) or +63 917 123 4567.",
      },
      { status: 500 }
    );
  }
}
