import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // If webhook secret is configured, verify signature
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch {
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }
  } else {
    event = JSON.parse(body) as Stripe.Event;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const ticketCodes = session.metadata?.ticketCodes?.split(",") || [];

    // Update tickets to PAID
    for (const code of ticketCodes) {
      await prisma.ticket.updateMany({
        where: { ticketCode: code, status: "RESERVED" },
        data: {
          status: "PAID",
          purchasedAt: new Date(),
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
