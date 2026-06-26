"use client";

import { useEffect, useState } from "react";
import {
  formatGenerationDate,
  formatGenerationDateLocal,
} from "@/lib/history/utils";

type BillingInvoiceDateProps = {
  iso: string;
};

export default function BillingInvoiceDate({ iso }: BillingInvoiceDateProps) {
  const [display, setDisplay] = useState(() => formatGenerationDate(iso));

  useEffect(() => {
    setDisplay(formatGenerationDateLocal(iso));
  }, [iso]);

  return <time dateTime={iso}>{display}</time>;
}
