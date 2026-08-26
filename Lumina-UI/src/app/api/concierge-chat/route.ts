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

    // 1. Defend Against SQL Injection, XSS, & System Jailbreak Attacks
    const sqlInjectionPattern =
      /(union\s+select|select\s+.*\s+from|drop\s+table|delete\s+from|insert\s+into|alter\s+table|--|;|\/\*|\*\/|xp_cmdshell|1\s*=\s*1|or\s+1\s*=\s*1)/i;
    const jailbreakPattern =
      /(ignore\s+previous\s+instructions|ignore\s+all\s+instructions|system\s+prompt|developer\s+mode|dan\s+mode|override\s+system)/i;
    const xssPattern = /(<script|javascript:|onload=|onerror=|<iframe|<img\s+src=x)/i;

    if (
      sqlInjectionPattern.test(trimmedQuery) ||
      jailbreakPattern.test(trimmedQuery) ||
      xssPattern.test(trimmedQuery)
    ) {
      return NextResponse.json({
        status: 'security_blocked',
        bot_name: 'Lumi',
        reply:
          '🛡️ **Security Alert:** Your inquiry contains unauthorized syntax, scripts, or system command patterns. As Lumina Dental Studio’s AI Clinical Concierge, I strictly provide verified information regarding our dental services, pricing, HMO coverage, and aftercare.\n\nFor clinical appointments, please visit [Schedule an appointment here](https://luminadentalcarestudio.vercel.app/#booking) or contact our clinic desk at **(02) 8888-LUMI (5864)**.',
        matched_chunks: 0,
        session_id: session_id || 'security-session',
      });
    }

    // 2. Critical Emergency Red-Flag Triage Check
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
          '🚨 **URGENT CLINICAL ALERT:** If you are experiencing severe swelling, difficulty breathing, or uncontrolled bleeding, please seek immediate emergency care or call our 24/7 Clinical Emergency Line right away:\n\n📞 **(02) 8888-LUMI (5864)** • **+63 917 123 4567**\n\nOur attending oral surgeons and dentists are on standby for acute emergencies.',
        matched_chunks: 1,
        session_id: session_id || 'emergency-session',
      });
    }

    // 3. Try proxying to live n8n webhook (Workflow 7)
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
        if (data.reply || data.response) {
          const resText = (data.reply || data.response || data.message) as string;
          const isGenericRejection = resText.toLowerCase().includes('i can only answer questions related to');
          const isClinicQuestion =
            lowerQuery.includes('hour') ||
            lowerQuery.includes('location') ||
            lowerQuery.includes('branch') ||
            lowerQuery.includes('schedule') ||
            lowerQuery.includes('open') ||
            lowerQuery.includes('bgc') ||
            lowerQuery.includes('ortigas') ||
            lowerQuery.includes('alabang') ||
            lowerQuery.includes('whitening') ||
            lowerQuery.includes('cleaning') ||
            lowerQuery.includes('wisdom') ||
            lowerQuery.includes('extraction') ||
            lowerQuery.includes('post-op') ||
            lowerQuery.includes('bleeding') ||
            lowerQuery.includes('hmo') ||
            lowerQuery.includes('maxicare') ||
            lowerQuery.includes('price') ||
            lowerQuery.includes('cost');

          if (!isGenericRejection || !isClinicQuestion) {
            return NextResponse.json({
              status: 'success',
              bot_name: data.bot_name || 'Lumi',
              reply: resText,
              matched_chunks: data.matched_chunks || 2,
              session_id: data.session_id || session_id,
            });
          }
        }
      }
    } catch (n8nErr) {
      console.warn('[Concierge API] n8n webhook unreachable, using grounded clinical fallback:', n8nErr);
    }

    // 4. Grounded Fallback Engine (Strictly adhering to Lumina Dental Studio 2026 SOPs & Company Info)
    let fallbackReply = '';

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
        "Ready to reserve your visit? [Schedule an appointment here](https://luminadentalcarestudio.vercel.app/#booking).";
    } else if (
      lowerQuery.includes('whitening') ||
      lowerQuery.includes('bleach') ||
      lowerQuery.includes('laser')
    ) {
      fallbackReply =
        "Laser Teeth Whitening (In‑Clinic Dual‑Light / Philips Zoom) costs **₱15,000 – ₱22,000**.\n" +
        "It is a cosmetic service and is not covered by HMO plans.\n\n" +
        "• Target: 4–8 shades brighter in a single 60-minute session.\n" +
        "• Take-Home Kit with Custom Trays: **₱8,500**.\n\n" +
        "Ready to brighten your smile? [Schedule an appointment here](https://luminadentalcarestudio.vercel.app/#booking).";
    } else if (
      lowerQuery.includes('wisdom') ||
      lowerQuery.includes('extraction') ||
      lowerQuery.includes('surgery') ||
      lowerQuery.includes('odontectomy')
    ) {
      fallbackReply =
        "🦷 **Wisdom Tooth Surgery & Extractions:**\n\n" +
        "• **Simple Extraction:** ₱2,500 – ₱4,000 (100% HMO Covered)\n" +
        "• **Surgical Wisdom Tooth Odontectomy:** ₱12,000 – ₱25,000 (Subject to HMO benefit limit)\n" +
        "• **Socket Preservation Bone Grafting:** ₱15,000 – ₱22,000\n\n" +
        "Includes digital radiographs, local pain management, and tailored aftercare. [Schedule an appointment here](https://luminadentalcarestudio.vercel.app/#booking).";
    } else if (
      lowerQuery.includes('bleeding') ||
      lowerQuery.includes('post-op') ||
      lowerQuery.includes('after extraction') ||
      lowerQuery.includes('swelling') ||
      lowerQuery.includes('dry socket') ||
      lowerQuery.includes('recovery')
    ) {
      fallbackReply =
        "🩹 **Post-Operative Extraction Care Guidelines:**\n\n" +
        "1. **Bite Firmly on Gauze:** Keep steady biting pressure for 45–60 minutes. If light oozing continues, a moistened black tea bag accelerates clot formation.\n" +
        "2. **Strict 72-Hour Prohibitions:** NO straws, NO smoking/vaping, and NO vigorous spitting to prevent painful Dry Socket.\n" +
        "3. **Cold Therapy:** Apply ice packs to your cheek (20 mins ON, 20 mins OFF) during the first 24 hours.\n\n" +
        "If heavy bleeding persists after 4 hours, call our 24/7 desk at **(02) 8888-LUMI (5864)**.";
    } else if (
      lowerQuery.includes('white diet') ||
      lowerQuery.includes('eat after whitening') ||
      lowerQuery.includes('coffee')
    ) {
      fallbackReply =
        "☕ **The 48-Hour 'White Diet' After Laser Whitening:**\n\n" +
        "Your enamel pores remain temporarily permeable for 48 hours:\n\n" +
        "✅ **Approved:** Water, skim milk, white rice, skinless chicken breast, white fish, plain yogurt, bananas, cream-sauce pasta.\n" +
        "❌ **Strictly Avoid:** Coffee, black/green tea, red wine, soy sauce, curries, tomato sauce, berries, dark sodas, and smoking.";
    } else if (
      lowerQuery.includes('cleaning') ||
      lowerQuery.includes('prophylaxis') ||
      lowerQuery.includes('deep scaling') ||
      lowerQuery.includes('checkup')
    ) {
      fallbackReply =
        "🩺 **Diagnostic & Preventive Hygiene:**\n\n" +
        "• **Comprehensive Exam & Digital X-Rays:** ₱1,200 (100% HMO Covered)\n" +
        "• **Standard Dental Cleaning (Prophylaxis):** ₱2,500 – ₱3,500 (Semi-annual HMO covered)\n" +
        "• **Air-Flow Master® Polish:** ₱1,800 add-on\n" +
        "• **Deep Scaling & Root Planing:** ₱3,500 / quadrant\n\n" +
        "Protect your gums and teeth! [Schedule an appointment here](https://luminadentalcarestudio.vercel.app/#booking).";
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
        "We support direct digital verification and billing for:\n" +
        "• **Maxicare Healthcare**\n" +
        "• **Intellicare / Asalus**\n" +
        "• **Medicard Philippines**\n" +
        "• **PhilCare**\n" +
        "• **Etiqa Life & General**\n" +
        "• **CareHealth Plus**\n" +
        "• **Cigna Global & Bupa**\n\n" +
        "Please bring your physical/digital HMO card and 1 valid ID on your appointment day.";
    } else if (
      lowerQuery.includes('location') ||
      lowerQuery.includes('where') ||
      lowerQuery.includes('branch') ||
      lowerQuery.includes('bgc') ||
      lowerQuery.includes('ortigas') ||
      lowerQuery.includes('alabang') ||
      lowerQuery.includes('address')
    ) {
      fallbackReply =
        "📍 **Lumina Dental Studio Locations:**\n\n" +
        "1. **BGC (Main Studio):** 3rd Floor, High Street South Corporate Plaza, Bonifacio Global City, Taguig\n" +
        "2. **Ortigas Center:** Suite 1402, One Corporate Centre, Julia Vargas Ave, Pasig City\n" +
        "3. **Alabang:** 2nd Level, Commerce Center, Filinvest City, Muntinlupa\n\n" +
        "Phone: **(02) 8888-LUMI (5864)** • Mobile: **+63 917 123 4567**\n\n" +
        "[Schedule an appointment here](https://luminadentalcarestudio.vercel.app/#booking).";
    } else if (
      lowerQuery.includes('price') ||
      lowerQuery.includes('cost') ||
      lowerQuery.includes('rates') ||
      lowerQuery.includes('fee') ||
      lowerQuery.includes('aligner') ||
      lowerQuery.includes('veneer') ||
      lowerQuery.includes('implant')
    ) {
      fallbackReply =
        "💎 **Official 2026 Transparent Fee Schedule:**\n\n" +
        "• **Oral Exam & Digital X-Rays:** ₱1,200 (100% HMO Covered)\n" +
        "• **Cleaning (Prophylaxis):** ₱2,500 – ₱3,500\n" +
        "• **Laser Teeth Whitening:** ₱15,000 – ₱22,000\n" +
        "• **Wisdom Tooth Surgery:** ₱12,000 – ₱25,000\n" +
        "• **Porcelain Veneers:** ₱22,000 – ₱28,000 / unit\n" +
        "• **Lumina Clear Aligners:** ₱85,000 – ₱210,000 (0% installment plans available)\n\n" +
        "Ready to begin your smile journey? [Schedule an appointment here](https://luminadentalcarestudio.vercel.app/#booking).";
    } else {
      // Unrelated prompt refusal
      const dentalKeywords = [
        'dent', 'tooth', 'teeth', 'gum', 'smile', 'cavity', 'filling', 'pain',
        'appointment', 'book', 'dr', 'doctor', 'clinic', 'lumina', 'mouth', 'root'
      ];
      const isDentalRelated = dentalKeywords.some((k) => lowerQuery.includes(k));

      if (!isDentalRelated) {
        fallbackReply =
          "I can only answer questions related to Lumina Dental Studio's services, pricing, HMO coverage, and dental care policies. For direct inquiries, please contact our reception team at **(02) 8888-LUMI (5864)**.\n\nReady to book? [Schedule an appointment here](https://luminadentalcarestudio.vercel.app/#booking).";
      } else {
        fallbackReply =
          "I’m Lumi, your 24/7 Lumina Dental Concierge! I can assist you with our services, transparent pricing, clinic schedule, HMO verification, or post-treatment recovery.\n\nReady to get started? [Schedule an appointment here](https://luminadentalcarestudio.vercel.app/#booking).";
      }
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
          "I apologize, I'm experiencing a brief connectivity hiccup. Please reach our clinic reception directly at **(02) 8888-LUMI (5864)** or **+63 917 123 4567**.\n\nYou can also [Schedule an appointment here](https://luminadentalcarestudio.vercel.app/#booking).",
      },
      { status: 500 }
    );
  }
}
