"use client";
import { MessageCircle } from "lucide-react";
import { getWhatsAppUrl, DEFAULT_WHATSAPP } from "@/lib/utils";
import { generalInquiryMessage } from "@/lib/whatsapp";

export function WhatsAppFAB({ whatsapp = DEFAULT_WHATSAPP }: { whatsapp?: string }) {
  return (
    <a
      href={getWhatsAppUrl(whatsapp, generalInquiryMessage("Je suis sur le site Imprimelle"))}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-40 md:bottom-6 w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-90 transition-transform duration-200 animate-pulse-slow"
      style={{
        boxShadow: "0 4px 16px rgba(37,211,102,0.35)",
      }}
      aria-label="Contactez-nous sur WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}
