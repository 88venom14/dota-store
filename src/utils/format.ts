export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '$0';
  const rounded = Math.round(value * 100) / 100;
  const parts = rounded.toFixed(2).split('.');
  const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimal = parts[1] === '00' ? '' : `.${parts[1]}`;
  return `$${integer}${decimal}`;
}
