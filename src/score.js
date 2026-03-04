export function calcPoints({ pickedWinner, pickedTotal, actualWinner, actualTotal }) {
  if (!actualWinner || actualTotal == null) return 0;

  let points = 0;
  if (pickedWinner && actualWinner && pickedWinner === actualWinner) points += 20;
  const diff = Math.abs(Number(pickedTotal) - Number(actualTotal));
  if (diff === 0) points += 50;
  else if (diff <= 5) points += 10;
  else if (diff <= 10) points += 7;
  else if (diff <= 20) points += 4;

  return points;
}