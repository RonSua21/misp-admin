export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(amount: number) {
  return `\u20B1 ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}
