import { NextResponse } from "next/server";
import { buildPaymentInvoicePdf } from "@/lib/billing/invoice-pdf";
import { getPaymentById, paymentInvoiceLabel } from "@/lib/billing/payments";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payment = await getPaymentById(id);

    if (
      !payment ||
      payment.userId !== user.id ||
      payment.status !== "success"
    ) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const pdfBytes = buildPaymentInvoicePdf(payment);
    const filename = `${paymentInvoiceLabel(payment)}.pdf`;

    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[payments/invoice] Download error:", error);
    return NextResponse.json(
      { error: "Unable to download invoice." },
      { status: 500 }
    );
  }
}
