const SALES_EMAIL = "sales@useadvora.com";
const SALES_SUBJECT = "Advora Enterprise Inquiry";
const SALES_BODY = `Company Name:
Website:
Team Size:
Requirements:
`;

export function getContactSalesMailtoUrl(): string {
  const params = new URLSearchParams({
    subject: SALES_SUBJECT,
    body: SALES_BODY,
  });

  return `mailto:${SALES_EMAIL}?${params.toString()}`;
}
