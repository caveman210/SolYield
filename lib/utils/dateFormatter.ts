export const formatDate = (
  dateString: string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  const date = new Date(dateString);

  if (format === 'short') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // medium (default)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isTomorrow = (dateString: string): boolean => {
  const date = new Date(dateString);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
};
