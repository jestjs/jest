
export function loop(num) {
  let a = 1;
  let b = 0;
  let temp;

  while (num >= 0) {
    temp = a;
    a += b;
    b = temp;
    num--;
  }

  return b;
}

export function recursive(num) {
  if (num <= 1) {
    return 1;
  }

  return recursive(num - 1) + recursive(num - 2);
}
