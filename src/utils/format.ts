export function formatTL(amount: number | string) {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
  } catch {
    return `₺${(+n).toFixed(2)}`;
  }
}

export function formatDate(ts: number) {
  try {
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
      .format(new Date(ts));
  } catch {
    return new Date(ts).toDateString();
  }
}

export function formatTime(ts: number) {
  try {
    return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })
      .format(new Date(ts));
  } catch {
    const d = new Date(ts); return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
}
